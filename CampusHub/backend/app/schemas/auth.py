from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.common import ORMModel


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    enrollment_no: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9\-/]+$")
    department_id: int | None = None
    program_id: int | None = None
    year_of_study: int = Field(default=1, ge=1, le=6)
    phone: str | None = Field(default=None, max_length=20)

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        if not any(c.isdigit() for c in v) or not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter and one number")
        return v


class StudentProfile(ORMModel):
    id: int
    enrollment_no: str
    year_of_study: int
    phone: str | None
    department_id: int | None
    program_id: int | None
    department_name: str | None = None
    program_name: str | None = None


class UserOut(ORMModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    student: StudentProfile | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    year_of_study: int | None = Field(default=None, ge=1, le=6)
    department_id: int | None = None
    program_id: int | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
