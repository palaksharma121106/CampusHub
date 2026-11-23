from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.schemas.auth import StudentProfile
from app.schemas.common import ORMModel


class StudentAdminOut(ORMModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
    student: StudentProfile | None


class StudentAdminCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    enrollment_no: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9\-/]+$")
    department_id: int | None = None
    program_id: int | None = None
    year_of_study: int = Field(default=1, ge=1, le=6)
    phone: str | None = Field(default=None, max_length=20)


class StudentAdminUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    is_active: bool | None = None
    department_id: int | None = None
    program_id: int | None = None
    year_of_study: int | None = Field(default=None, ge=1, le=6)
    phone: str | None = Field(default=None, max_length=20)


class ActivityOut(ORMModel):
    id: int
    action: str
    entity: str
    summary: str
    created_at: datetime
    user_name: str | None = None


class QueryLogOut(ORMModel):
    id: int
    query_text: str
    input_mode: str
    answered: bool
    source_count: int
    generator: str
    response_time_ms: int
    created_at: datetime
    user_name: str | None = None
