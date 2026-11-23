"""Create / update / read schemas for the institutional information entities."""
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field, computed_field

from app.schemas.common import ORMModel

Str200 = Field(min_length=1, max_length=200)


def _optional(model: type[BaseModel], name: str) -> type[BaseModel]:
    """Build an update schema where every field of `model` is optional."""
    from copy import copy

    from pydantic import create_model

    fields = {}
    for key, info in model.model_fields.items():
        optional_info = copy(info)
        optional_info.default = None
        optional_info.default_factory = None
        fields[key] = (info.annotation | None, optional_info)
    return create_model(name, **fields)  # type: ignore[call-overload]


# ---------- Departments ----------
class DepartmentIn(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    code: str = Field(min_length=1, max_length=20)
    description: str | None = None
    hod_name: str | None = Field(default=None, max_length=150)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    location: str | None = Field(default=None, max_length=150)


class DepartmentOut(ORMModel, DepartmentIn):
    id: int
    email: str | None = None
    updated_at: datetime


# ---------- Programs ----------
class ProgramIn(BaseModel):
    name: str = Str200
    code: str = Field(min_length=1, max_length=30)
    level: str = Field(pattern="^(UG|PG|Doctoral|Diploma)$")
    department_id: int
    duration_years: int = Field(ge=1, le=7)
    total_seats: int | None = Field(default=None, ge=0)
    eligibility: str | None = None
    description: str | None = None


class ProgramOut(ORMModel, ProgramIn):
    id: int
    department_name: str | None = None
    updated_at: datetime


# ---------- Courses ----------
class CourseIn(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    title: str = Str200
    program_id: int
    department_id: int
    semester: int = Field(ge=1, le=12)
    credits: int = Field(ge=0, le=30)
    course_type: str = Field(default="Core", pattern="^(Core|Elective|Lab|Project)$")
    description: str | None = None


class CourseOut(ORMModel, CourseIn):
    id: int
    program_name: str | None = None
    department_name: str | None = None
    updated_at: datetime


# ---------- Subjects ----------
class SubjectIn(BaseModel):
    course_id: int
    code: str = Field(min_length=1, max_length=25)
    name: str = Str200
    component: str = Field(default="Theory", pattern="^(Theory|Lab|Tutorial|Project)$")
    credits: int = Field(ge=0, le=30)
    weekly_hours: int | None = Field(default=None, ge=0, le=40)
    faculty_id: int | None = None


class SubjectOut(ORMModel, SubjectIn):
    id: int
    course_title: str | None = None
    course_code: str | None = None
    semester: int | None = None
    faculty_name: str | None = None
    updated_at: datetime


# ---------- Syllabus ----------
class SyllabusIn(BaseModel):
    course_id: int
    unit_number: int = Field(ge=1, le=20)
    title: str = Str200
    topics: str = Field(min_length=1)
    hours: int | None = Field(default=None, ge=0, le=200)
    reference_books: str | None = None


class SyllabusOut(ORMModel, SyllabusIn):
    id: int
    course_title: str | None = None
    course_code: str | None = None
    updated_at: datetime


# ---------- Faculty ----------
class FacultyIn(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    designation: str = Field(min_length=2, max_length=100)
    department_id: int
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    qualification: str | None = Field(default=None, max_length=255)
    specialization: str | None = Field(default=None, max_length=255)
    office: str | None = Field(default=None, max_length=100)
    experience_years: int | None = Field(default=None, ge=0, le=70)


class FacultyOut(ORMModel, FacultyIn):
    id: int
    email: str | None = None
    department_name: str | None = None
    updated_at: datetime


# ---------- Fees ----------
class FeeIn(BaseModel):
    program_id: int
    academic_year: str = Field(pattern=r"^\d{4}-\d{2}$")
    year_of_study: int = Field(ge=1, le=7)
    tuition_fee: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    hostel_fee: Decimal = Field(default=Decimal(0), ge=0, max_digits=10, decimal_places=2)
    exam_fee: Decimal = Field(default=Decimal(0), ge=0, max_digits=10, decimal_places=2)
    other_fee: Decimal = Field(default=Decimal(0), ge=0, max_digits=10, decimal_places=2)
    notes: str | None = None


class FeeOut(ORMModel, FeeIn):
    id: int
    program_name: str | None = None
    total_fee: Decimal
    updated_at: datetime


# ---------- Library ----------
class LibraryIn(BaseModel):
    title: str = Str200
    category: str = Field(pattern="^(Timings|Section|E-Resource|Service|Rule)$")
    description: str | None = None
    location: str | None = Field(default=None, max_length=150)
    timings: str | None = Field(default=None, max_length=200)
    url: str | None = Field(default=None, max_length=500)


class LibraryOut(ORMModel, LibraryIn):
    id: int
    updated_at: datetime


# ---------- Campus facilities (incl. hostels) ----------
class FacilityIn(BaseModel):
    name: str = Str200
    category: str = Field(pattern="^(Hostel|Sports|Dining|Transport|Laboratory|Services|Recreation|Other)$")
    description: str | None = None
    location: str | None = Field(default=None, max_length=150)
    timings: str | None = Field(default=None, max_length=200)
    contact: str | None = Field(default=None, max_length=150)
    capacity: int | None = Field(default=None, ge=0)


class FacilityOut(ORMModel, FacilityIn):
    id: int
    updated_at: datetime


# ---------- Medical ----------
class MedicalIn(BaseModel):
    name: str = Str200
    facility_type: str = Field(min_length=2, max_length=50)
    description: str | None = None
    location: str | None = Field(default=None, max_length=150)
    timings: str | None = Field(default=None, max_length=200)
    contact_phone: str | None = Field(default=None, max_length=30)
    doctor_name: str | None = Field(default=None, max_length=150)
    is_emergency: bool = False


class MedicalOut(ORMModel, MedicalIn):
    id: int
    updated_at: datetime


# ---------- Contacts ----------
class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    designation: str | None = Field(default=None, max_length=150)
    office: str = Field(min_length=2, max_length=150)
    phone: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    available_hours: str | None = Field(default=None, max_length=150)
    is_emergency: bool = False


class ContactOut(ORMModel, ContactIn):
    id: int
    email: str | None = None
    updated_at: datetime


# ---------- Announcements ----------
class AnnouncementIn(BaseModel):
    title: str = Str200
    content: str = Field(min_length=1)
    category: str = Field(default="General", max_length=40)
    priority: str = Field(default="normal", pattern="^(normal|important|urgent)$")
    is_published: bool = True
    expires_at: datetime | None = None


class AnnouncementOut(ORMModel, AnnouncementIn):
    id: int
    created_at: datetime
    updated_at: datetime
    author_name: str | None = None


DepartmentUpdate = _optional(DepartmentIn, "DepartmentUpdate")
ProgramUpdate = _optional(ProgramIn, "ProgramUpdate")
CourseUpdate = _optional(CourseIn, "CourseUpdate")
SubjectUpdate = _optional(SubjectIn, "SubjectUpdate")
SyllabusUpdate = _optional(SyllabusIn, "SyllabusUpdate")
FacultyUpdate = _optional(FacultyIn, "FacultyUpdate")
FeeUpdate = _optional(FeeIn, "FeeUpdate")
LibraryUpdate = _optional(LibraryIn, "LibraryUpdate")
FacilityUpdate = _optional(FacilityIn, "FacilityUpdate")
MedicalUpdate = _optional(MedicalIn, "MedicalUpdate")
ContactUpdate = _optional(ContactIn, "ContactUpdate")
AnnouncementUpdate = _optional(AnnouncementIn, "AnnouncementUpdate")
