from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    APP_NAME: str = "CampusHub API"
    ENVIRONMENT: str = "development"
    COLLEGE_NAME: str = "Demo Institute of Technology"

    DATABASE_URL: str = "mysql+pymysql://campushub:campushub@localhost:3306/campushub"

    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    UPLOAD_DIR: Path = BACKEND_DIR / "uploads"
    INDEX_DIR: Path = BACKEND_DIR / "data" / "faiss"
    MAX_UPLOAD_MB: int = 20

    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_BACKEND: str = "sentence-transformers"  # or "hashing" (offline fallback)
    CHUNK_SIZE: int = 900
    CHUNK_OVERLAP: int = 150
    RETRIEVAL_TOP_K: int = 6
    MIN_RELEVANCE: float = 0.30

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    FIRST_ADMIN_EMAIL: str = "admin@campushub.demo"
    FIRST_ADMIN_PASSWORD: str = "Admin@12345"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, v):
        if isinstance(v, str) and not v.strip().startswith("["):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
