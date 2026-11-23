import logging
import threading
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import admin, assistant, auth, documents, public, resources
from app.core.config import settings
from app.database.session import SessionLocal

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("campushub")


def warm_up_rag() -> None:
    """Load the embedding model and (re)build indexes without blocking server start-up."""
    from app.rag.pipeline import get_pipeline

    try:
        pipeline = get_pipeline()
        with SessionLocal() as db:
            pipeline.ensure_documents_indexed(db)
            n = pipeline.rebuild_records(db)
        log.info("RAG ready: %s records, %s document vectors, generator=%s",
                 n, pipeline.documents.size, pipeline.generator.name)
    except Exception:
        log.exception("RAG warm-up failed")


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.INDEX_DIR.mkdir(parents=True, exist_ok=True)
    threading.Thread(target=warm_up_rag, daemon=True).start()
    yield


app = FastAPI(title=settings.APP_NAME, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(Exception)
async def unhandled(_: Request, exc: Exception):
    log.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "An unexpected server error occurred"})


api = APIRouter(prefix="/api")
for module in (auth, public, resources, assistant, documents, admin):
    api.include_router(module.router)
app.include_router(api)


@app.get("/api/health", tags=["public"])
def health():
    return {"status": "ok"}
