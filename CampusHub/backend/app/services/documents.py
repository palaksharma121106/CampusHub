"""Document upload validation, storage and background indexing."""
import hashlib
import io
import logging
import os
import threading
import uuid
import zipfile
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import SessionLocal
from app.models import DocumentChunk, UploadedDocument
from app.rag.chunker import chunk_pages
from app.rag.extractor import ExtractionError, extract_text
from app.rag.pipeline import RagPipeline, get_pipeline

log = logging.getLogger(__name__)
_document_processing_lock = threading.Lock()

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


async def save_upload(file: UploadFile) -> tuple[str, str, int, str]:
    """Validate and persist an upload. Returns its stored name, type, size and digest."""
    name = Path(file.filename or "").name
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in ALLOWED:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed")
    content_type = (file.content_type or "").split(";", 1)[0].strip().lower()
    if content_type and content_type not in ALLOWED[ext]:
        raise HTTPException(status_code=400, detail=f"Unexpected content type {content_type}")

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds the {settings.MAX_UPLOAD_MB} MB limit")
    if not data:
        raise HTTPException(status_code=400, detail="File is empty")
    if not data.startswith(MAGIC[ext]):
        raise HTTPException(status_code=400, detail="File content does not match its extension")
    if ext == "docx":
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                names = set(archive.namelist())
                if "[Content_Types].xml" not in names or "word/document.xml" not in names:
                    raise HTTPException(status_code=400, detail="File is not a valid DOCX document")
        except zipfile.BadZipFile as exc:
            raise HTTPException(status_code=400, detail="DOCX file is corrupted") from exc

    digest = hashlib.sha256(data).hexdigest()
    stored = f"{uuid.uuid4().hex}.{ext}"
    directory = upload_dir()
    temporary_path = directory / f".{stored}.tmp"
    try:
        temporary_path.write_bytes(data)
        os.replace(temporary_path, directory / stored)
    except OSError as exc:
        try:
            temporary_path.unlink(missing_ok=True)
        except OSError:
            log.exception("Could not remove partial upload %s", temporary_path.name)
        log.exception("Failed to store uploaded document %s", name)
        raise HTTPException(status_code=500, detail="Could not store the uploaded file") from exc
    return stored, ext, len(data), digest


def find_duplicate_document(
    db: Session,
    digest: str,
    size: int,
    exclude_id: int | None = None,
) -> UploadedDocument | None:
    stmt = select(UploadedDocument).where(UploadedDocument.content_sha256 == digest)
    if exclude_id is not None:
        stmt = stmt.where(UploadedDocument.id != exclude_id)
    duplicate = db.scalar(stmt)
    if duplicate:
        return duplicate

    legacy_stmt = select(UploadedDocument).where(
        UploadedDocument.content_sha256.is_(None),
        UploadedDocument.file_size == size,
    )
    if exclude_id is not None:
        legacy_stmt = legacy_stmt.where(UploadedDocument.id != exclude_id)
    for candidate in db.scalars(legacy_stmt):
        path = upload_dir() / Path(candidate.stored_filename).name
        try:
            if hashlib.sha256(path.read_bytes()).hexdigest() == digest:
                return candidate
        except OSError:
            log.warning("Cannot compare legacy document file %s", candidate.id, exc_info=True)
    return None


def delete_file(stored_filename: str) -> None:
    path = upload_dir() / stored_filename
    if path.exists():
        path.unlink()


def process_document(document_id: int) -> None:
    """Extract → chunk → embed → store in FAISS. Runs as a background task."""
    with _document_processing_lock:
        with SessionLocal() as db:
            doc = db.get(UploadedDocument, document_id)
            if not doc:
                log.warning("Cannot process missing document %s", document_id)
                return

            log.info("Processing uploaded document %s (%s)", doc.id, doc.original_filename)
            doc.status, doc.error_message = "processing", None
            db.commit()
            old_ids = list(
                db.scalars(select(DocumentChunk.id).where(DocumentChunk.document_id == doc.id))
            )
            pipeline = None
            new_ids: list[int] = []
            try:
                pipeline = get_pipeline()
                pages = extract_text(upload_dir() / doc.stored_filename, doc.file_type)
                chunks = chunk_pages(pages, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
                if not chunks:
                    raise ExtractionError("No text chunks could be created from this document")

                rows = [
                    DocumentChunk(
                        document_id=doc.id,
                        chunk_index=chunk.index,
                        page_number=chunk.page_number,
                        content=chunk.content,
                    )
                    for chunk in chunks
                ]
                db.add_all(rows)
                db.flush()
                new_ids = [row.id for row in rows]
                pipeline.index_chunks(rows)

                if old_ids:
                    db.execute(delete(DocumentChunk).where(DocumentChunk.id.in_(old_ids)))
                doc.status = "indexed"
                doc.chunk_count = len(rows)
                doc.page_count = len({p.page_number for p in pages if p.page_number}) or None
                doc.indexed_at = datetime.utcnow()
                db.commit()
                log.info(
                    "Indexed document %s: %s pages, %s chunks",
                    document_id,
                    doc.page_count or 1,
                    doc.chunk_count,
                )
            except ExtractionError as exc:
                log.warning("Document %s could not be processed: %s", document_id, exc)
                _mark_document_failed(db, document_id, str(exc), pipeline, new_ids)
                return
            except Exception as exc:
                log.exception("Indexing failed for document %s", document_id)
                _mark_document_failed(db, document_id, f"Indexing failed: {exc}", pipeline, new_ids)
                return

            try:
                pipeline.remove_chunks(old_ids)
            except Exception:
                log.exception("Could not remove superseded vectors for document %s", document_id)


def _mark_document_failed(
    db: Session,
    document_id: int,
    message: str,
    pipeline: RagPipeline | None,
    new_ids: list[int],
) -> None:
    db.rollback()
    if pipeline and new_ids:
        try:
            pipeline.remove_chunks(new_ids)
        except Exception:
            log.exception("Could not remove incomplete vectors for document %s", document_id)
    doc = db.get(UploadedDocument, document_id)
    if doc:
        doc.status = "failed"
        doc.error_message = message
        db.commit()


def recover_interrupted_documents() -> int:
    """Make jobs interrupted by a process exit visible and retryable in the admin UI."""
    with SessionLocal() as db:
        docs = db.scalars(
            select(UploadedDocument).where(UploadedDocument.status.in_(("pending", "processing")))
        ).all()
        for doc in docs:
            doc.status = "failed"
            doc.error_message = "Processing was interrupted by a server restart. Retry indexing."
        db.commit()
        if docs:
            log.warning("Marked %s interrupted document jobs as failed", len(docs))
        return len(docs)


def refresh_records_index() -> None:
    try:
        with SessionLocal() as db:
            get_pipeline().rebuild_records(db)
    except Exception:
        log.exception("Failed to rebuild the database records index")
