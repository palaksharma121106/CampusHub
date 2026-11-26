
"""Persistent FAISS vector store keyed by integer ids."""
import json
import os
import threading
from pathlib import Path

import numpy as np


def _get_faiss():
    """Import FAISS only when the vector store is initialized."""
    import faiss
    faiss.omp_set_num_threads(1)
    return faiss


class FaissStore:
    def __init__(self, directory: Path, name: str, dimension: int, embedder_name: str):
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)
        self.index_path = self.directory / f"{name}.index"
        self.meta_path = self.directory / f"{name}.meta.json"
        self.dimension = dimension
        self.embedder_name = embedder_name
        self._lock = threading.Lock()
        self.index = self._load()

    def _new_index(self):
        faiss = _get_faiss()
        return faiss.IndexIDMap2(faiss.IndexFlatIP(self.dimension))

    def _load(self):
        faiss = _get_faiss()

        if self.index_path.exists() and self.meta_path.exists():
            meta = json.loads(self.meta_path.read_text())
            if (
                meta.get("dimension") == self.dimension
                and meta.get("embedder") == self.embedder_name
            ):
                return faiss.read_index(str(self.index_path))

        return self._new_index()

    def _save(self):
        faiss = _get_faiss()
        index_tmp = self.index_path.with_suffix(".index.tmp")
        meta_tmp = self.meta_path.with_suffix(".meta.json.tmp")
        faiss.write_index(self.index, str(index_tmp))
        meta_tmp.write_text(
            json.dumps({
                "dimension": self.dimension,
                "embedder": self.embedder_name
            })
        )
        os.replace(index_tmp, self.index_path)
        os.replace(meta_tmp, self.meta_path)

    @property
    def size(self) -> int:
        with self._lock:
            return int(self.index.ntotal)

    def add(self, ids: list[int], vectors: np.ndarray) -> None:
        if not ids:
            return

        _get_faiss()
        vectors = np.ascontiguousarray(vectors, dtype="float32")
        if vectors.shape != (len(ids), self.dimension) or not np.isfinite(vectors).all():
            raise ValueError("Vectors do not match the index dimension or contain non-finite values")

        with self._lock:
            self.index.remove_ids(np.asarray(ids, dtype="int64"))
            self.index.add_with_ids(
                vectors,
                np.asarray(ids, dtype="int64")
            )
            self._save()

    def remove(self, ids: list[int]) -> None:
        if not ids:
            return

        _get_faiss()
        with self._lock:
            self.index.remove_ids(np.asarray(ids, dtype="int64"))
            self._save()

    def reset(self) -> None:
        _get_faiss()
        with self._lock:
            self.index = self._new_index()
            self._save()

    def search(self, vector: np.ndarray, k: int) -> list[tuple[int, float]]:
        _get_faiss()
        vector = np.asarray(vector, dtype="float32").reshape(-1)
        if vector.shape != (self.dimension,) or not np.isfinite(vector).all():
            raise ValueError("Query vector does not match the index dimension")

        with self._lock:
            size = int(self.index.ntotal)
            if size == 0:
                return []
            scores, ids = self.index.search(
                vector.reshape(1, -1),
                min(k, size)
            )

        return [
            (int(i), float(s))
            for i, s in zip(ids[0], scores[0])
            if i != -1
        ]
