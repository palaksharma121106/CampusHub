from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class AskRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1000)
    session_id: int | None = None
    input_mode: str = Field(default="text", pattern="^(text|voice)$")


class SourceOut(BaseModel):
    number: int
    source_type: str
    title: str
    section: str | None = None
    page: int | None = None
    score: float
    excerpt: str
    document_id: int | None = None
    link: str | None = None


class AskResponse(BaseModel):
    session_id: int
    message_id: int
    answer: str
    sources: list[SourceOut]
    answered: bool
    generator: str
    response_time_ms: int


class ChatMessageOut(ORMModel):
    id: int
    role: str
    content: str
    sources: list[SourceOut] | None = None
    created_at: datetime


class ChatSessionOut(ORMModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime


class ChatSessionDetail(ChatSessionOut):
    messages: list[ChatMessageOut]


class DocumentOut(ORMModel):
    id: int
    title: str
    category: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    error_message: str | None
    page_count: int | None
    chunk_count: int
    is_verified: bool
    indexed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class DocumentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=255)
    category: str | None = Field(default=None, max_length=50)
    is_verified: bool | None = None
