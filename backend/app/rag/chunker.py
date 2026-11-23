"""Split page text into overlapping, sentence-aware chunks."""
import re
from dataclasses import dataclass

from app.rag.extractor import PageText


@dataclass
class Chunk:
    index: int
    page_number: int | None
    content: str


_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+|\n{2,}|\n(?=[A-Z0-9•\-*])")


def _normalise(text: str) -> str:
    text = text.replace("\r", "")
    text = re.sub(r"[ \t]+", " ", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def chunk_pages(pages: list[PageText], chunk_size: int = 900, overlap: int = 150) -> list[Chunk]:
    chunks: list[Chunk] = []
    for page in pages:
        sentences = [s.strip() for s in _SENTENCE_SPLIT.split(_normalise(page.text)) if s.strip()]
        current = ""
        for sentence in sentences:
            while len(sentence) > chunk_size:  # hard-wrap very long sentences / tables
                head, sentence = sentence[:chunk_size], sentence[chunk_size - overlap:]
                if current:
                    chunks.append(Chunk(len(chunks), page.page_number, current))
                    current = ""
                chunks.append(Chunk(len(chunks), page.page_number, head))
            if current and len(current) + len(sentence) + 1 > chunk_size:
                chunks.append(Chunk(len(chunks), page.page_number, current))
                tail = current[-overlap:]
                tail = tail[tail.find(" ") + 1:] if " " in tail else tail
                current = f"{tail} {sentence}".strip()
            else:
                current = f"{current} {sentence}".strip()
        if current:
            chunks.append(Chunk(len(chunks), page.page_number, current))
    return chunks
