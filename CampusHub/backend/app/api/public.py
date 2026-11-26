from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app import models as m
from app.api.deps import get_current_user
from app.core.config import settings
from app.database.session import get_db

router = APIRouter(tags=["public"])


@router.get("/public/overview")
def overview(db: Session = Depends(get_db)):
    count = lambda model: db.scalar(select(func.count()).select_from(model)) or 0  # noqa: E731
    return {
        "college_name": settings.COLLEGE_NAME,
        "departments": count(m.Department),
        "programs": count(m.AcademicProgram),
        "faculty": count(m.Faculty),
        "courses": count(m.Course),
        "documents": db.scalar(select(func.count()).where(m.UploadedDocument.status == "indexed")) or 0,
    }


@router.get("/public/registration-options")
def registration_options(db: Session = Depends(get_db)):
    departments = db.scalars(select(m.Department).order_by(m.Department.name)).all()
    programs = db.scalars(select(m.AcademicProgram).order_by(m.AcademicProgram.name)).all()
    return {
        "departments": [{"id": d.id, "name": d.name} for d in departments],
        "programs": [{"id": p.id, "name": p.name, "department_id": p.department_id} for p in programs],
    }


SEARCHABLE = [
    (m.Department, "Department", ["name", "code", "description"], "name", "description", "/app/departments"),
    (m.AcademicProgram, "Program", ["name", "code", "description"], "name", "description", "/app/programs"),
    (m.Course, "Course", ["code", "title", "description"], "title", "code", "/app/courses"),
    (m.Subject, "Subject", ["code", "name"], "name", "code", "/app/subjects"),
    (m.Syllabus, "Syllabus", ["title", "topics"], "title", "topics", "/app/syllabus"),
    (m.Faculty, "Faculty", ["name", "designation", "specialization"], "name", "designation", "/app/faculty"),
    (m.LibraryResource, "Library", ["title", "description"], "title", "description", "/app/library"),
    (m.CampusFacility, "Facility", ["name", "description"], "name", "description", "/app/campus"),
    (m.MedicalFacility, "Medical", ["name", "description"], "name", "description", "/app/medical"),
    (m.ImportantContact, "Contact", ["name", "office", "designation"], "name", "office", "/app/contacts"),
    (m.Announcement, "Announcement", ["title", "content"], "title", "content", "/app/dashboard"),
]


@router.get("/search")
def global_search(q: str = Query(min_length=2, max_length=100), db: Session = Depends(get_db), _=Depends(get_current_user)):
    like = f"%{q.strip()}%"
    results = []
    for model, kind, fields, title_attr, sub_attr, link in SEARCHABLE:
        stmt = select(model).where(or_(*[getattr(model, f).ilike(like) for f in fields]))
        if model is m.Announcement:
            stmt = stmt.where(m.Announcement.is_published.is_(True))
        for obj in db.scalars(stmt.limit(5)).unique():
            if model is m.CampusFacility and obj.category == "Hostel":
                kind_, link_ = "Hostel", "/app/hostels"
            else:
                kind_, link_ = kind, link
            subtitle = getattr(obj, sub_attr) or ""
            results.append({"type": kind_, "id": obj.id, "title": getattr(obj, title_attr),
                            "subtitle": subtitle[:140], "link": link_})
    return {"query": q, "results": results[:40]}
