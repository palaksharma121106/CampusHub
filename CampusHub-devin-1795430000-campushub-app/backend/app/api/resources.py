"""Institutional information resources (read for students, full CRUD for admins)."""
from fastapi import APIRouter

from app import models as m
from app.api.crud import build_crud_router
from app.schemas import entities as s
from app.services.documents import refresh_records_index

router = APIRouter()

RESOURCES = [
    dict(model=m.Department, prefix="/departments", label="Department", create_schema=s.DepartmentIn,
         update_schema=s.DepartmentUpdate, out_schema=s.DepartmentOut, search_fields=["name", "code", "hod_name"],
         order_by=[m.Department.name]),
    dict(model=m.AcademicProgram, prefix="/programs", label="Program", create_schema=s.ProgramIn,
         update_schema=s.ProgramUpdate, out_schema=s.ProgramOut, search_fields=["name", "code", "description"],
         filter_fields=["level", "department_id"], order_by=[m.AcademicProgram.level.desc(), m.AcademicProgram.name]),
    dict(model=m.Course, prefix="/courses", label="Course", create_schema=s.CourseIn, update_schema=s.CourseUpdate,
         out_schema=s.CourseOut, search_fields=["code", "title", "description"],
         filter_fields=["program_id", "department_id", "semester", "course_type"],
         order_by=[m.Course.semester, m.Course.code], display=lambda o: f"{o.code} {o.title}"),
    dict(model=m.Subject, prefix="/subjects", label="Subject", create_schema=s.SubjectIn, update_schema=s.SubjectUpdate,
         out_schema=s.SubjectOut, search_fields=["code", "name"], filter_fields=["course_id", "component", "faculty_id"],
         order_by=[m.Subject.code]),
    dict(model=m.Syllabus, prefix="/syllabus", label="Syllabus unit", create_schema=s.SyllabusIn,
         update_schema=s.SyllabusUpdate, out_schema=s.SyllabusOut, search_fields=["title", "topics"],
         filter_fields=["course_id"], order_by=[m.Syllabus.course_id, m.Syllabus.unit_number]),
    dict(model=m.Faculty, prefix="/faculty", label="Faculty member", create_schema=s.FacultyIn,
         update_schema=s.FacultyUpdate, out_schema=s.FacultyOut,
         search_fields=["name", "designation", "specialization", "email"],
         filter_fields=["department_id", "designation"], order_by=[m.Faculty.name]),
    dict(model=m.FeeStructure, prefix="/fees", label="Fee structure", create_schema=s.FeeIn, update_schema=s.FeeUpdate,
         out_schema=s.FeeOut, search_fields=["academic_year", "notes"],
         filter_fields=["program_id", "academic_year", "year_of_study"],
         order_by=[m.FeeStructure.program_id, m.FeeStructure.year_of_study],
         display=lambda o: f"{o.program_name} {o.academic_year} (year {o.year_of_study})"),
    dict(model=m.LibraryResource, prefix="/library", label="Library resource", create_schema=s.LibraryIn,
         update_schema=s.LibraryUpdate, out_schema=s.LibraryOut, search_fields=["title", "description"],
         filter_fields=["category"], order_by=[m.LibraryResource.category, m.LibraryResource.title]),
    dict(model=m.CampusFacility, prefix="/facilities", label="Campus facility", create_schema=s.FacilityIn,
         update_schema=s.FacilityUpdate, out_schema=s.FacilityOut, search_fields=["name", "description", "location"],
         filter_fields=["category"], order_by=[m.CampusFacility.category, m.CampusFacility.name]),
    dict(model=m.MedicalFacility, prefix="/medical", label="Medical facility", create_schema=s.MedicalIn,
         update_schema=s.MedicalUpdate, out_schema=s.MedicalOut, search_fields=["name", "description", "doctor_name"],
         filter_fields=["facility_type", "is_emergency"], order_by=[m.MedicalFacility.is_emergency.desc(), m.MedicalFacility.name]),
    dict(model=m.ImportantContact, prefix="/contacts", label="Contact", create_schema=s.ContactIn,
         update_schema=s.ContactUpdate, out_schema=s.ContactOut, search_fields=["name", "office", "designation"],
         filter_fields=["is_emergency"], order_by=[m.ImportantContact.is_emergency.desc(), m.ImportantContact.office]),
    dict(model=m.Announcement, prefix="/announcements", label="Announcement", create_schema=s.AnnouncementIn,
         update_schema=s.AnnouncementUpdate, out_schema=s.AnnouncementOut, search_fields=["title", "content"],
         filter_fields=["category", "priority"], order_by=[m.Announcement.created_at.desc(), m.Announcement.id.desc()],
         base_filter=lambda model, user: None if user.role_name == "admin" else model.is_published.is_(True)),
]

for spec in RESOURCES:
    router.include_router(build_crud_router(tag=spec["label"], on_change=refresh_records_index, **{k: v for k, v in spec.items()}))
