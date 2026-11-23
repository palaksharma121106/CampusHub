from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import Date, cast, func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import log_activity, require_admin
from app.core.security import hash_password
from app.database.session import get_db
from app.models import (
    AcademicProgram, ActivityLog, Announcement, Course, Department, Faculty, QueryLog, Role, Student,
    UploadedDocument, User,
)
from app.rag.pipeline import get_pipeline
from app.schemas.admin import ActivityOut, QueryLogOut, StudentAdminCreate, StudentAdminOut, StudentAdminUpdate
from app.schemas.common import Page

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    count = lambda model: db.scalar(select(func.count()).select_from(model)) or 0  # noqa: E731
    week_ago = datetime.utcnow() - timedelta(days=7)
    total_queries = count(QueryLog)
    answered = db.scalar(select(func.count()).where(QueryLog.answered.is_(True))) or 0
    pipeline = get_pipeline()
    return {
        "students": count(Student),
        "faculty": count(Faculty),
        "courses": count(Course),
        "programs": count(AcademicProgram),
        "departments": count(Department),
        "documents": count(UploadedDocument),
        "indexed_documents": db.scalar(select(func.count()).where(UploadedDocument.status == "indexed")) or 0,
        "announcements": count(Announcement),
        "queries": total_queries,
        "queries_this_week": db.scalar(select(func.count()).where(QueryLog.created_at >= week_ago)) or 0,
        "answer_rate": round(answered / total_queries * 100, 1) if total_queries else 0,
        "avg_response_ms": int(db.scalar(select(func.avg(QueryLog.response_time_ms))) or 0),
        "voice_queries": db.scalar(select(func.count()).where(QueryLog.input_mode == "voice")) or 0,
        "vector_count": pipeline.documents.size + pipeline.records.size,
        "generator": pipeline.generator.name,
        "embedder": pipeline.embedder.name,
    }


@router.get("/analytics")
def analytics(days: int = Query(default=14, ge=1, le=90), db: Session = Depends(get_db), _: User = Depends(require_admin)):
    since = datetime.utcnow().date() - timedelta(days=days - 1)
    day = cast(QueryLog.created_at, Date)
    rows = db.execute(
        select(day.label("d"), QueryLog.answered, func.count())
        .where(QueryLog.created_at >= since).group_by("d", QueryLog.answered)
    ).all()
    series = {since + timedelta(days=i): {"answered": 0, "unanswered": 0} for i in range(days)}
    for d, answered, n in rows:
        key = d if not isinstance(d, str) else datetime.strptime(d, "%Y-%m-%d").date()
        if key in series:
            series[key]["answered" if answered else "unanswered"] += n
    modes = db.execute(select(QueryLog.input_mode, func.count()).group_by(QueryLog.input_mode)).all()
    docs = db.execute(select(UploadedDocument.category, func.count()).group_by(UploadedDocument.category)).all()
    top = db.execute(
        select(func.lower(QueryLog.query_text).label("q"), func.count().label("n")).group_by("q")
        .order_by(func.count().desc()).limit(8)
    ).all()
    return {
        "daily": [{"date": d.isoformat(), **v} for d, v in series.items()],
        "input_modes": [{"mode": m, "count": n} for m, n in modes],
        "documents_by_category": [{"category": c, "count": n} for c, n in docs],
        "top_questions": [{"question": q, "count": n} for q, n in top],
    }


@router.get("/activity", response_model=list[ActivityOut])
def activity(limit: int = Query(default=15, ge=1, le=100), db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.scalars(select(ActivityLog).order_by(ActivityLog.id.desc()).limit(limit)).all()


@router.get("/queries", response_model=Page[QueryLogOut])
def query_logs(q: str | None = Query(default=None, max_length=100), answered: bool | None = None,
               page: int = Query(default=1, ge=1), page_size: int = Query(default=25, ge=1, le=200),
               db: Session = Depends(get_db), _: User = Depends(require_admin)):
    stmt = select(QueryLog)
    if q:
        stmt = stmt.where(QueryLog.query_text.ilike(f"%{q}%"))
    if answered is not None:
        stmt = stmt.where(QueryLog.answered.is_(answered))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.order_by(QueryLog.id.desc()).offset((page - 1) * page_size).limit(page_size)).unique().all()
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.post("/reindex-records")
def reindex_records(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    n = get_pipeline().rebuild_records(db)
    log_activity(db, admin, "reindex", "Knowledge base", None, f"Rebuilt database knowledge index ({n} records)")
    db.commit()
    return {"records_indexed": n}


# ---------- Students ----------
def _student_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if not user or user.role_name != "student":
        raise HTTPException(status_code=404, detail="Student not found")
    return user


@router.get("/students", response_model=Page[StudentAdminOut])
def list_students(q: str | None = Query(default=None, max_length=100), department_id: int | None = None,
                  year_of_study: int | None = None, page: int = Query(default=1, ge=1),
                  page_size: int = Query(default=25, ge=1, le=200),
                  db: Session = Depends(get_db), _: User = Depends(require_admin)):
    stmt = select(User).join(Role).outerjoin(Student).where(Role.name == "student")
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(User.full_name.ilike(like), User.email.ilike(like), Student.enrollment_no.ilike(like)))
    if department_id:
        stmt = stmt.where(Student.department_id == department_id)
    if year_of_study:
        stmt = stmt.where(Student.year_of_study == year_of_study)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = db.scalars(stmt.order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size)).unique().all()
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.post("/students", response_model=StudentAdminOut, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentAdminCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    email = payload.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    if db.scalar(select(Student.id).where(Student.enrollment_no == payload.enrollment_no.upper())):
        raise HTTPException(status_code=409, detail="This enrollment number is already registered")
    role = db.scalar(select(Role).where(Role.name == "student"))
    user = User(email=email, full_name=payload.full_name, password_hash=hash_password(payload.password), role_id=role.id)
    user.student = Student(enrollment_no=payload.enrollment_no.upper(), department_id=payload.department_id,
                           program_id=payload.program_id, year_of_study=payload.year_of_study, phone=payload.phone)
    db.add(user)
    db.flush()
    log_activity(db, admin, "create", "Student", user.id, f"Added student: {user.full_name}")
    db.commit()
    db.refresh(user)
    return user


@router.put("/students/{user_id}", response_model=StudentAdminOut)
def update_student(user_id: int, payload: StudentAdminUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = _student_user(db, user_id)
    data = payload.model_dump(exclude_unset=True)
    for key in ("full_name", "is_active"):
        if key in data and data[key] is not None:
            setattr(user, key, data.pop(key))
        data.pop(key, None)
    if user.student:
        for key, value in data.items():
            setattr(user.student, key, value)
    log_activity(db, admin, "update", "Student", user.id, f"Updated student: {user.full_name}")
    db.commit()
    db.refresh(user)
    return user


@router.delete("/students/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = _student_user(db, user_id)
    name = user.full_name
    db.delete(user)
    log_activity(db, admin, "delete", "Student", user_id, f"Removed student: {name}")
    db.commit()
