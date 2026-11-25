"""Document upload validation, storage and background indexing."""
import logging
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import delete, select

from app.core.config import settings
from app.database.session import SessionLocal
from app.models import DocumentChunk, UploadedDocument
from app.rag.chunker import chunk_pages
from app.rag.extractor import ExtractionError, extract_text
from app.rag.pipeline import get_pipeline

log = logging.getLogger(__name__)

ALLOWED = {
    "pdf": {"application/pdf", "application/octet-stream"},
    "docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream",
        "application/zip",
    },
}
MAGIC = {"pdf": b"%PDF", "docx": b"PK\x03\x04"}


def upload_dir() -> Path:
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return settings.UPLOAD_DIR


async def save_upload(file: UploadFile) -> tuple[str, str, int]:
    """Validate and persist an upload. Returns (stored_filename, file_type, size)."""
    name = Path(file.filename or "").name
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in ALLOWED:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")
    if file.content_type and file.content_type not in ALLOWED[ext]:
        raise HTTPException(status_code=400, detail=f"Unexpected content type {file.content_type}")

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds the {settings.MAX_UPLOAD_MB} MB limit")
    if not data:
        raise HTTPException(status_code=400, detail="File is empty")
    if not data.startswith(MAGIC[ext]):
        raise HTTPException(status_code=400, detail="File content does not match its extension")

    stored = f"{uuid.uuid4().hex}.{ext}"
    (upload_dir() / stored).write_bytes(data)
    return stored, ext, len(data)


def delete_file(stored_filename: str) -> None:
    path = upload_dir() / stored_filename
    if path.exists():
        path.unlink()


def process_document(document_id: int) -> None:
    """Extract → chunk → embed → store in FAISS. Runs as a background task."""
    pipeline = get_pipeline()
    with SessionLocal() as db:
        doc = db.get(UploadedDocument, document_id)
        if not doc:
            return
        doc.status, doc.error_message = "processing", None
        db.commit()
        old_ids = list(db.scalars(select(DocumentChunk.id).where(DocumentChunk.document_id == doc.id)))
        try:
            pages = extract_text(upload_dir() / doc.stored_filename, doc.file_type)
            chunks = chunk_pages(pages, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
            pipeline.remove_chunks(old_ids)
            db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == doc.id))
            rows = [DocumentChunk(document_id=doc.id, chunk_index=c.index, page_number=c.page_number, content=c.content)
                    for c in chunks]
            db.add_all(rows)
            db.flush()
            pipeline.index_chunks(rows)
            doc.status = "indexed"
            doc.chunk_count = len(rows)
            doc.page_count = len([p for p in pages if p.page_number]) or None
            doc.indexed_at = datetime.utcnow()
            db.commit()
        except (ExtractionError, FileNotFoundError) as exc:
            db.rollback()
            doc = db.get(UploadedDocument, document_id)
            doc.status, doc.error_message = "failed", str(exc)
            db.commit()
        except Exception as exc:
            log.exception("Indexing failed for document %s", document_id)
            db.rollback()
            doc = db.get(UploadedDocument, document_id)
            doc.status, doc.error_message = "failed", f"Unexpected error: {exc}"
            db.commit()


def refresh_records_index() -> None:
    try:
        with SessionLocal() as db:
            get_pipeline().rebuild_records(db)
    except Exception:
        log.exception("Failed to rebuild the database records index")
