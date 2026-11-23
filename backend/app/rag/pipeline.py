"""RAG pipeline: index documents + database records in FAISS, retrieve, and generate grounded answers."""
import logging
import threading
from dataclasses import asdict, dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import DocumentChunk, UploadedDocument
from app.rag.embeddings import Embedder, get_embedder
from app.rag.generator import NO_INFO_ANSWER, AnswerGenerator, ContextPassage, get_generator
from app.rag.records import RecordPassage, build_record_passages
from app.rag.vector_store import FaissStore

log = logging.getLogger(__name__)


@dataclass
class Source:
    number: int
    source_type: str  # "document" | "database"
    title: str
    section: str | None
    page: int | None
    score: float
    excerpt: str
    document_id: int | None = None
    link: str | None = None


@dataclass
class Answer:
    answer: str
    sources: list[Source]
    answered: bool
    generator: str

    def sources_dict(self) -> list[dict]:
        return [asdict(s) for s in self.sources]


class RagPipeline:
    def __init__(self, embedder: Embedder, generator_factory=get_generator):
        self.embedder = embedder
        self.generator_factory = generator_factory
        self.documents = FaissStore(settings.INDEX_DIR, "documents", embedder.dimension, embedder.name)
        self.records = FaissStore(settings.INDEX_DIR, "records", embedder.dimension, embedder.name)
        self._record_passages: list[RecordPassage] = []
        self._records_lock = threading.Lock()

    @property
    def generator(self) -> AnswerGenerator:
        return self.generator_factory()

    # ----- documents -----
    def index_chunks(self, chunks: list[DocumentChunk]) -> None:
        if chunks:
            self.documents.add([c.id for c in chunks], self.embedder.embed([c.content for c in chunks]))

    def remove_chunks(self, chunk_ids: list[int]) -> None:
        self.documents.remove(chunk_ids)

    def ensure_documents_indexed(self, db: Session) -> None:
        """Rebuild the document index from MySQL if the FAISS file was lost (e.g. new container)."""
        expected = db.scalar(
            select(DocumentChunk.id).join(UploadedDocument).where(UploadedDocument.status == "indexed").limit(1)
        )
        if expected is not None and self.documents.size == 0:
            log.info("Rebuilding FAISS document index from database chunks")
            chunks = db.scalars(
                select(DocumentChunk).join(UploadedDocument).where(UploadedDocument.status == "indexed")
            ).all()
            for i in range(0, len(chunks), 256):
                self.index_chunks(list(chunks[i:i + 256]))

    # ----- structured records -----
    def rebuild_records(self, db: Session) -> int:
        passages = build_record_passages(db)
        vectors = self.embedder.embed([f"{p.section}: {p.title}. {p.text}" for p in passages]) if passages else None
        with self._records_lock:
            self.records.reset()
            if passages:
                self.records.add(list(range(len(passages))), vectors)
            self._record_passages = passages
        return len(passages)

    # ----- query -----
    def retrieve(self, db: Session, question: str, k: int | None = None) -> list[Source]:
        k = k or settings.RETRIEVAL_TOP_K
        qv = self.embedder.embed([question])[0]
        candidates: list[Source] = []

        doc_hits = self.documents.search(qv, k)
        if doc_hits:
            chunk_map = {
                c.id: c
                for c in db.scalars(
                    select(DocumentChunk).join(UploadedDocument)
                    .where(DocumentChunk.id.in_([i for i, _ in doc_hits]), UploadedDocument.status == "indexed")
                )
            }
            for chunk_id, score in doc_hits:
                chunk = chunk_map.get(chunk_id)
                if chunk:
                    doc = chunk.document
                    bonus = 0.03 if doc.is_verified else 0.0
                    candidates.append(Source(0, "document", doc.title, doc.category, chunk.page_number,
                                             round(score + bonus, 4), chunk.content, document_id=doc.id))

        with self._records_lock:
            passages = self._record_passages
            for idx, score in self.records.search(qv, k):
                if idx < len(passages):
                    p = passages[idx]
                    candidates.append(Source(0, "database", p.title, p.section, None, round(score, 4), p.text, link=p.link))

        candidates.sort(key=lambda s: s.score, reverse=True)
        cutoff = max(settings.MIN_RELEVANCE, candidates[0].score * 0.6) if candidates else 1.0
        relevant = [c for c in candidates if c.score >= cutoff]
        for n, s in enumerate(relevant[:k], start=1):
            s.number = n
        return relevant[:k]

    def answer(self, db: Session, question: str, history: list[tuple[str, str]] | None = None) -> Answer:
        sources = self.retrieve(db, question)
        if not sources:
            return Answer(NO_INFO_ANSWER, [], False, "none")
        passages = [
            ContextPassage(
                s.number,
                (f"{s.title}" + (f", page {s.page}" if s.page else "") + " (verified institutional document)")
                if s.source_type == "document" else f"CampusHub database – {s.section}: {s.title}",
                s.excerpt,
            )
            for s in sources
        ]
        generator = self.generator
        try:
            text = generator.generate(question, passages, history or [])
            name = generator.name
        except Exception as exc:
            log.exception("Generator failed, using extractive fallback: %s", exc)
            from app.rag.generator import ExtractiveGenerator

            fallback = ExtractiveGenerator()
            text, name = fallback.generate(question, passages, history or []), fallback.name
        answered = text.strip() != NO_INFO_ANSWER
        cited = [s for s in sources if f"[{s.number}]" in text] or sources
        return Answer(text, cited if answered else [], answered, name)


_pipeline: RagPipeline | None = None
_pipeline_lock = threading.Lock()


def get_pipeline() -> RagPipeline:
    global _pipeline
    with _pipeline_lock:
        if _pipeline is None:
            _pipeline = RagPipeline(get_embedder())
        return _pipeline


def set_pipeline(pipeline: RagPipeline | None) -> None:
    global _pipeline
    _pipeline = pipeline
