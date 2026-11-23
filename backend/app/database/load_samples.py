"""Upload and index the demonstration PDF/DOCX files in docs/sample-documents (skips files already loaded).

Usage: python -m app.database.load_samples [directory]
"""
import shutil
import sys
import uuid
from pathlib import Path

from sqlalchemy import select

from app.database.session import SessionLocal
from app.models import UploadedDocument, User
from app.core.config import settings
from app.services.documents import process_document, upload_dir

DEFAULT_DIR = Path(__file__).resolve().parents[3] / "docs" / "sample-documents"
CATEGORIES = {"regulation": "Academics", "hostel": "Hostel", "fee": "Fees", "library": "Library", "medical": "Medical"}


def load(directory: Path) -> None:
    files = sorted(p for p in directory.glob("*") if p.suffix.lower() in (".pdf", ".docx"))
    with SessionLocal() as db:
        admin = db.scalar(select(User).where(User.email == settings.FIRST_ADMIN_EMAIL))
        for path in files:
            if db.scalar(select(UploadedDocument.id).where(UploadedDocument.original_filename == path.name)):
                print(f"skip   {path.name} (already loaded)")
                continue
            ext = path.suffix.lower().lstrip(".")
            stored = f"{uuid.uuid4().hex}.{ext}"
            shutil.copyfile(path, upload_dir() / stored)
            title = path.stem.replace("-demo", " (Demo)").replace("-", " ").title()
            category = next((c for k, c in CATEGORIES.items() if k in path.stem.lower()), "General")
            doc = UploadedDocument(title=title, category=category, original_filename=path.name, stored_filename=stored,
                                   file_type=ext, file_size=path.stat().st_size, uploaded_by=admin.id if admin else None)
            db.add(doc)
            db.commit()
            process_document(doc.id)
            db.refresh(doc)
            print(f"{doc.status:6} {path.name} ({doc.chunk_count} chunks)")


if __name__ == "__main__":
    load(Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DIR)
