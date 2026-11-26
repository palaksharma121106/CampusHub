"""Extract text (with page numbers where available) from PDF and DOCX files."""
from dataclasses import dataclass
from pathlib import Path


@dataclass
class PageText:
    page_number: int | None
    text: str


class ExtractionError(Exception):
    pass


def extract_pdf(path: Path) -> list[PageText]:
    from pypdf import PdfReader

    try:
        reader = PdfReader(str(path))
        pages = []
        for i, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            if text:
                pages.append(PageText(i, text))
        return pages
    except Exception as exc:
        raise ExtractionError(f"Could not extract text from PDF: {exc}") from exc


def extract_docx(path: Path) -> list[PageText]:
    import docx

    try:
        document = docx.Document(str(path))
    except Exception as exc:
        raise ExtractionError(f"Could not read DOCX: {exc}") from exc
    blocks = [p.text.strip() for p in document.paragraphs if p.text.strip()]
    for table in document.tables:
        for row in table.rows:
            cells = [c.text.strip() for c in row.cells if c.text.strip()]
            if cells:
                blocks.append(" | ".join(dict.fromkeys(cells)))
    # DOCX has no fixed pagination, so the whole document is returned as one "page".
    return [PageText(None, "\n".join(blocks))] if blocks else []


def extract_text(path: Path, file_type: str) -> list[PageText]:
    file_type = file_type.lower()
    if file_type == "pdf":
        pages = extract_pdf(path)
    elif file_type == "docx":
        pages = extract_docx(path)
    else:
        raise ExtractionError(f"Unsupported file type: {file_type}")
    if not pages:
        raise ExtractionError("No extractable text found (scanned image PDFs are not supported)")
    return pages
