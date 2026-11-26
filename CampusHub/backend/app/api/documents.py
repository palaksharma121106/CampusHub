import logging

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import log_activity, require_admin
from app.database.session import get_db
from app.models import DocumentChunk, UploadedDocument, User
from app.rag.pipeline import get_pipeline
from app.schemas.assistant import DocumentOut, DocumentUpdate
from app.services.documents import delete_file, find_duplicate_document, process_document, save_upload

router = APIRouter(prefix="/admin/documents", tags=["documents"])
log = logging.getLogger(__name__)


def _get(db: Session, doc_id: int) -> UploadedDocument:
    doc = db.get(UploadedDocument, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.scalars(select(UploadedDocument).order_by(UploadedDocument.created_at.desc(), UploadedDocument.id.desc())).all()


@router.post("", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    bg: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(default="", max_length=255),
    category: str = Form(default="General", max_length=50),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    stored, ext, size, digest = await save_upload(file)
    try:
        duplicate = find_duplicate_document(db, digest, size)
        if duplicate:
            raise HTTPException(
                status_code=409,
                detail=f"This file is already stored as “{duplicate.title}” (document {duplicate.id})",
            )
        doc = UploadedDocument(
            title=title.strip() or (file.filename or stored).rsplit(".", 1)[0],
            category=category.strip() or "General",
            original_filename=(file.filename or stored)[:255],
            stored_filename=stored, file_type=ext, file_size=size,
            content_sha256=digest, status="pending", uploaded_by=admin.id,
        )
        db.add(doc)
        db.flush()
        log_activity(db, admin, "upload", "Document", doc.id, f"Uploaded document: {doc.title}")
        db.commit()
    except HTTPException:
        db.rollback()
        delete_file(stored)
        raise
    except IntegrityError as exc:
        db.rollback()
        delete_file(stored)
        duplicate = find_duplicate_document(db, digest, size)
        if duplicate:
            raise HTTPException(
                status_code=409,
                detail=f"This file is already stored as “{duplicate.title}” (document {duplicate.id})",
            ) from exc
        log.exception("Could not save uploaded document metadata")
        raise HTTPException(status_code=500, detail="Could not save document metadata") from exc
    except Exception as exc:
        db.rollback()
        delete_file(stored)
        log.exception("Could not save uploaded document metadata")
        raise HTTPException(status_code=500, detail="Could not save document metadata") from exc
    db.refresh(doc)
    bg.add_task(process_document, doc.id)
    return doc


@router.get("/{doc_id}", response_model=DocumentOut)
def get_document(doc_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return _get(db, doc_id)


@router.put("/{doc_id}", response_model=DocumentOut)
def update_document(doc_id: int, payload: DocumentUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    doc = _get(db, doc_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(doc, key, value)
    log_activity(db, admin, "update", "Document", doc.id, f"Updated document details: {doc.title}")
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{doc_id}/replace", response_model=DocumentOut)
async def replace_document(doc_id: int, bg: BackgroundTasks, file: UploadFile = File(...),
                           db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    doc = _get(db, doc_id)
    stored, ext, size, digest = await save_upload(file)
    try:
        duplicate = find_duplicate_document(db, digest, size, exclude_id=doc.id)
        if duplicate:
            raise HTTPException(
                status_code=409,
                detail=f"This file is already stored as “{duplicate.title}” (document {duplicate.id})",
            )
        old_stored = doc.stored_filename
        doc.stored_filename, doc.file_type, doc.file_size = stored, ext, size
        doc.content_sha256 = digest
        doc.original_filename = (file.filename or stored)[:255]
        doc.status, doc.error_message = "pending", None
        log_activity(db, admin, "replace", "Document", doc.id, f"Uploaded new version of: {doc.title}")
        db.commit()
    except HTTPException:
        db.rollback()
        delete_file(stored)
        raise
    except IntegrityError as exc:
        db.rollback()
        delete_file(stored)
        duplicate = find_duplicate_document(db, digest, size, exclude_id=doc.id)
        if duplicate:
            raise HTTPException(
                status_code=409,
                detail=f"This file is already stored as “{duplicate.title}” (document {duplicate.id})",
            ) from exc
        log.exception("Could not save replacement document metadata")
        raise HTTPException(status_code=500, detail="Could not save replacement document metadata") from exc
    except Exception as exc:
        db.rollback()
        delete_file(stored)
        log.exception("Could not save replacement document metadata")
        raise HTTPException(status_code=500, detail="Could not save replacement document metadata") from exc
    try:
        delete_file(old_stored)
    except OSError:
        log.exception("Could not remove replaced document file %s", old_stored)
    db.refresh(doc)
    bg.add_task(process_document, doc.id)
    return doc


@router.post("/{doc_id}/reindex", response_model=DocumentOut)
def reindex_document(doc_id: int, bg: BackgroundTasks, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    doc = _get(db, doc_id)
    doc.status = "pending"
    doc.error_message = None
    log_activity(db, admin, "reindex", "Document", doc.id, f"Re-indexed document: {doc.title}")
    db.commit()
    db.refresh(doc)
    bg.add_task(process_document, doc.id)
    return doc


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(doc_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    doc = _get(db, doc_id)
    chunk_ids = list(db.scalars(select(DocumentChunk.id).where(DocumentChunk.document_id == doc.id)))
    stored_filename = doc.stored_filename
    title = doc.title
    db.delete(doc)
    log_activity(db, admin, "delete", "Document", doc_id, f"Deleted document: {title}")
    db.commit()
    try:
        get_pipeline().remove_chunks(chunk_ids)
    except Exception:
        log.exception("Could not remove vectors for deleted document %s", doc_id)
    try:
        delete_file(stored_filename)
    except OSError:
        log.exception("Could not remove file for deleted document %s", doc_id)
