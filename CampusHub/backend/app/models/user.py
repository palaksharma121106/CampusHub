from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.base import TimestampMixin


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    token_version: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)

    role: Mapped[Role] = relationship(lazy="joined")
    student: Mapped["Student | None"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")

    @property
    def role_name(self) -> str:
        return self.role.name if self.role else ""


class Student(TimestampMixin, Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    enrollment_no: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id", ondelete="SET NULL"), index=True)
    program_id: Mapped[int | None] = mapped_column(ForeignKey("academic_programs.id", ondelete="SET NULL"), index=True)
    year_of_study: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))

    user: Mapped[User] = relationship(back_populates="student")
    department: Mapped["Department | None"] = relationship(lazy="joined")
    program: Mapped["AcademicProgram | None"] = relationship(lazy="joined")


from app.models.academic import AcademicProgram, Department  # noqa: E402,F401

Student.department_name = property(lambda self: self.department.name if self.department else None)
Student.program_name = property(lambda self: self.program.name if self.program else None)
