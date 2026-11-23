"""Persistent FAISS vector store keyed by integer ids."""
import json
import threading
from pathlib import Path

import faiss
import numpy as np


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
        return faiss.IndexIDMap2(faiss.IndexFlatIP(self.dimension))

    def _load(self):
        if self.index_path.exists() and self.meta_path.exists():
            meta = json.loads(self.meta_path.read_text())
            if meta.get("dimension") == self.dimension and meta.get("embedder") == self.embedder_name:
                return faiss.read_index(str(self.index_path))
        return self._new_index()

    def _save(self):
        faiss.write_index(self.index, str(self.index_path))
        self.meta_path.write_text(json.dumps({"dimension": self.dimension, "embedder": self.embedder_name}))

    @property
    def size(self) -> int:
        return int(self.index.ntotal)

    def add(self, ids: list[int], vectors: np.ndarray) -> None:
        if not ids:
            return
        with self._lock:
            self.index.remove_ids(np.asarray(ids, dtype="int64"))
            self.index.add_with_ids(vectors.astype("float32"), np.asarray(ids, dtype="int64"))
            self._save()

    def remove(self, ids: list[int]) -> None:
        if not ids:
            return
        with self._lock:
            self.index.remove_ids(np.asarray(ids, dtype="int64"))
            self._save()

    def reset(self) -> None:
        with self._lock:
            self.index = self._new_index()
            self._save()

    def search(self, vector: np.ndarray, k: int) -> list[tuple[int, float]]:
        if self.size == 0:
            return []
        with self._lock:
            scores, ids = self.index.search(vector.reshape(1, -1).astype("float32"), min(k, self.size))
        return [(int(i), float(s)) for i, s in zip(ids[0], scores[0]) if i != -1]
