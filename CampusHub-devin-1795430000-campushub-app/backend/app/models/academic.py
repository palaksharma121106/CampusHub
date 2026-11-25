from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.base import TimestampMixin


class Department(TimestampMixin, Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    hod_name: Mapped[str | None] = mapped_column(String(150))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(30))
    location: Mapped[str | None] = mapped_column(String(150))


class AcademicProgram(TimestampMixin, Base):
    __tablename__ = "academic_programs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # UG / PG / Doctoral / Diploma
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id", ondelete="CASCADE"), index=True, nullable=False)
    duration_years: Mapped[int] = mapped_column(Integer, nullable=False)
    total_seats: Mapped[int | None] = mapped_column(Integer)
    eligibility: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)

    department: Mapped[Department] = relationship(lazy="joined")


class Course(TimestampMixin, Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    program_id: Mapped[int] = mapped_column(ForeignKey("academic_programs.id", ondelete="CASCADE"), index=True, nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id", ondelete="CASCADE"), index=True, nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    credits: Mapped[int] = mapped_column(Integer, nullable=False)
    course_type: Mapped[str] = mapped_column(String(20), default="Core", nullable=False)  # Core / Elective / Lab
    description: Mapped[str | None] = mapped_column(Text)

    program: Mapped[AcademicProgram] = relationship(lazy="joined")
    department: Mapped[Department] = relationship(lazy="joined")


class Subject(TimestampMixin, Base):
    """A teachable component of a course (theory, lab, tutorial, project)."""

    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), index=True, nullable=False)
    code: Mapped[str] = mapped_column(String(25), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    component: Mapped[str] = mapped_column(String(20), default="Theory", nullable=False)
    credits: Mapped[int] = mapped_column(Integer, nullable=False)
    weekly_hours: Mapped[int | None] = mapped_column(Integer)
    faculty_id: Mapped[int | None] = mapped_column(ForeignKey("faculty.id", ondelete="SET NULL"), index=True)

    course: Mapped[Course] = relationship(lazy="joined")
    faculty: Mapped["Faculty | None"] = relationship(lazy="joined")


class Syllabus(TimestampMixin, Base):
    __tablename__ = "syllabus"
    __table_args__ = (UniqueConstraint("course_id", "unit_number", name="uq_syllabus_course_unit"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), index=True, nullable=False)
    unit_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    topics: Mapped[str] = mapped_column(Text, nullable=False)
    hours: Mapped[int | None] = mapped_column(Integer)
    reference_books: Mapped[str | None] = mapped_column(Text)

    course: Mapped[Course] = relationship(lazy="joined")


class Faculty(TimestampMixin, Base):
    __tablename__ = "faculty"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id", ondelete="CASCADE"), index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    phone: Mapped[str | None] = mapped_column(String(30))
    qualification: Mapped[str | None] = mapped_column(String(255))
    specialization: Mapped[str | None] = mapped_column(String(255))
    office: Mapped[str | None] = mapped_column(String(100))
    experience_years: Mapped[int | None] = mapped_column(Integer)

    department: Mapped[Department] = relationship(lazy="joined")


class FeeStructure(TimestampMixin, Base):
    __tablename__ = "fee_structures"
    __table_args__ = (UniqueConstraint("program_id", "academic_year", "year_of_study", name="uq_fee_program_year"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("academic_programs.id", ondelete="CASCADE"), index=True, nullable=False)
    academic_year: Mapped[str] = mapped_column(String(9), nullable=False)  # e.g. 2025-26
    year_of_study: Mapped[int] = mapped_column(Integer, nullable=False)
    tuition_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    hostel_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    exam_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    other_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    program: Mapped[AcademicProgram] = relationship(lazy="joined")

    @property
    def total_fee(self) -> Decimal:
        return sum((Decimal(self.tuition_fee or 0), Decimal(self.hostel_fee or 0),
                    Decimal(self.exam_fee or 0), Decimal(self.other_fee or 0)), Decimal(0))


def _name(rel: str, attr: str = "name"):
    return property(lambda self: getattr(getattr(self, rel), attr, None) if getattr(self, rel) else None)


AcademicProgram.department_name = _name("department")
Course.program_name = _name("program")
Course.department_name = _name("department")
Subject.course_title = _name("course", "title")
Subject.course_code = _name("course", "code")
Subject.semester = _name("course", "semester")
Subject.faculty_name = _name("faculty")
Syllabus.course_title = _name("course", "title")
Syllabus.course_code = _name("course", "code")
Faculty.department_name = _name("department")
FeeStructure.program_name = _name("program")
