"""Test fixtures: an isolated SQLite database, temporary storage and the offline hashing embedder."""
import os
import tempfile
from pathlib import Path

_tmp = Path(tempfile.mkdtemp(prefix="campushub-test-"))
os.environ.update(
    DATABASE_URL=f"sqlite:///{_tmp / 'test.db'}",
    UPLOAD_DIR=str(_tmp / "uploads"),
    INDEX_DIR=str(_tmp / "faiss"),
    EMBEDDING_BACKEND="hashing",
    GEMINI_API_KEY="",
    JWT_SECRET_KEY="test-secret",
    FIRST_ADMIN_EMAIL="admin@campushub.demo",
    FIRST_ADMIN_PASSWORD="Admin@12345",
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.database.init_db import create_tables  # noqa: E402
from app.database.seed import seed  # noqa: E402
from app.database.session import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.rag.pipeline import get_pipeline  # noqa: E402

STUDENT_PASSWORD = "Student@123"


@pytest.fixture(scope="session", autouse=True)
def database():
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.INDEX_DIR.mkdir(parents=True, exist_ok=True)
    create_tables()
    with SessionLocal() as db:
        seed(db)
        get_pipeline().rebuild_records(db)
    yield


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


def _login(client, email, password):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture(scope="session")
def admin_headers(client):
    return _login(client, settings.FIRST_ADMIN_EMAIL, settings.FIRST_ADMIN_PASSWORD)


@pytest.fixture(scope="session")
def student_headers(client):
    return _login(client, "aarav.student@campushub.demo", STUDENT_PASSWORD)
