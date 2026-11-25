"""Embedding providers. All return L2-normalised float32 vectors so inner product == cosine similarity."""
import hashlib
import logging
import re
from functools import lru_cache
from typing import Protocol

import numpy as np

from app.core.config import settings

log = logging.getLogger(__name__)


class Embedder(Protocol):
    name: str
    dimension: int

    def embed(self, texts: list[str]) -> np.ndarray: ...


def _normalise(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return (vectors / norms).astype("float32")


class SentenceTransformerEmbedder:
    def __init__(self, model_name: str):
        from sentence_transformers import SentenceTransformer

        self.model = SentenceTransformer(model_name, device="cpu")
        self.name = model_name
        self.dimension = int(self.model.get_sentence_embedding_dimension())

    def embed(self, texts: list[str]) -> np.ndarray:
        vectors = self.model.encode(texts, batch_size=32, convert_to_numpy=True, normalize_embeddings=True)
        return np.asarray(vectors, dtype="float32")


class HashingEmbedder:
    """Dependency-free lexical embedder (feature hashing of word uni/bi-grams).

    Used only when the Sentence Transformers model cannot be loaded (e.g. offline CI)."""

    def __init__(self, dimension: int = 768):
        self.name = "hashing"
        self.dimension = dimension

    def _tokens(self, text: str) -> list[str]:
        words = re.findall(r"[a-z0-9]+", text.lower())
        return words + [f"{a}_{b}" for a, b in zip(words, words[1:])]

    def embed(self, texts: list[str]) -> np.ndarray:
        out = np.zeros((len(texts), self.dimension), dtype="float32")
        for row, text in enumerate(texts):
            for token in self._tokens(text):
                h = int(hashlib.md5(token.encode()).hexdigest(), 16)
                out[row, h % self.dimension] += 1.0 if (h >> 64) & 1 else -1.0
        return _normalise(out)


@lru_cache
def get_embedder() -> Embedder:
    if settings.EMBEDDING_BACKEND == "sentence-transformers":
        try:
            return SentenceTransformerEmbedder(settings.EMBEDDING_MODEL)
        except Exception as exc:  # network / model download failures
            log.warning("Falling back to hashing embedder: %s", exc)
    return HashingEmbedder()
