import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api import admin, assistant, auth, documents, public, resources
from app.core.config import settings
from app.services.documents import recover_interrupted_documents

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("campushub")


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.INDEX_DIR.mkdir(parents=True, exist_ok=True)
    try:
        recover_interrupted_documents()
    except SQLAlchemyError:
        log.exception("Could not recover interrupted document jobs")
    log.info("CampusHub API started; RAG models are initialized on first use")
    yield
    log.info("CampusHub API stopped")


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
