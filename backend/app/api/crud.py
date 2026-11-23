"""Factory that produces a consistent REST resource (list/detail for students, CRUD for admins)."""
from collections.abc import Callable
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, log_activity, require_admin
from app.database.session import get_db
from app.models import User
from app.schemas.common import Page


def build_crud_router(
    *,
    model: Any,
    prefix: str,
    tag: str,
    label: str,
    create_schema: type[BaseModel],
    update_schema: type[BaseModel],
    out_schema: type[BaseModel],
    search_fields: list[str],
    filter_fields: list[str] | None = None,
    order_by: list[Any] | None = None,
    display: Callable[[Any], str] = lambda obj: getattr(obj, "name", None) or getattr(obj, "title", str(obj.id)),
    base_filter: Callable[[Any, User], Any] | None = None,
    on_change: Callable[[], None] | None = None,
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])
    filter_fields = filter_fields or []

    def _get(db: Session, item_id: int):
        obj = db.get(model, item_id)
        if not obj:
            raise HTTPException(status_code=404, detail=f"{label} not found")
        return obj

    def _commit(db: Session):
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            msg = str(exc.orig).lower()
            if "duplicate" in msg or "unique" in msg:
                raise HTTPException(status_code=409, detail=f"A {label.lower()} with the same unique value already exists")
            if "foreign key" in msg:
                raise HTTPException(status_code=400, detail="Referenced record does not exist or is still in use")
            raise HTTPException(status_code=400, detail="Database constraint violated")

    def _schedule(bg: BackgroundTasks):
        if on_change:
            bg.add_task(on_change)

    @router.get("", response_model=Page[out_schema])
    def list_items(
        q: str | None = Query(default=None, max_length=100),
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=50, ge=1, le=200),
        db: Session = Depends(get_db),
        user: User = Depends(get_current_user),
        **filters: Any,
    ):
        stmt = select(model)
        if base_filter is not None:
            clause = base_filter(model, user)
            if clause is not None:
                stmt = stmt.where(clause)
        if q:
            like = f"%{q.strip()}%"
            stmt = stmt.where(or_(*[getattr(model, f).ilike(like) for f in search_fields]))
        for field in filter_fields:
            value = filters.get(field)
            if value not in (None, ""):
                stmt = stmt.where(getattr(model, field) == value)
        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        for clause in order_by or [model.id]:
            stmt = stmt.order_by(clause)
        items = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).unique().all()
        return Page(items=items, total=total, page=page, page_size=page_size)

    # FastAPI cannot read **kwargs, so expose each filter as an explicit optional query parameter.
    import inspect

    sig = inspect.signature(list_items)
    params = [p for p in sig.parameters.values() if p.kind != inspect.Parameter.VAR_KEYWORD]
    for field in filter_fields:
        column_type = getattr(model, field).type.python_type
        params.append(
            inspect.Parameter(field, inspect.Parameter.KEYWORD_ONLY, default=Query(default=None), annotation=column_type | None)
        )
    list_items.__signature__ = sig.replace(parameters=params)  # type: ignore[attr-defined]

    @router.get("/{item_id}", response_model=out_schema)
    def get_item(item_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
        return _get(db, item_id)

    @router.post("", response_model=out_schema, status_code=status.HTTP_201_CREATED)
    def create_item(payload: create_schema, bg: BackgroundTasks, db: Session = Depends(get_db), admin: User = Depends(require_admin)):  # type: ignore[valid-type]
        data = payload.model_dump()
        if hasattr(model, "created_by"):
            data["created_by"] = admin.id
        obj = model(**data)
        db.add(obj)
        _commit(db)
        log_activity(db, admin, "create", label, obj.id, f"Created {label.lower()}: {display(obj)}")
        db.commit()
        db.refresh(obj)
        _schedule(bg)
        return obj

    @router.put("/{item_id}", response_model=out_schema)
    def update_item(item_id: int, payload: update_schema, bg: BackgroundTasks, db: Session = Depends(get_db), admin: User = Depends(require_admin)):  # type: ignore[valid-type]
        obj = _get(db, item_id)
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(obj, key, value)
        _commit(db)
        log_activity(db, admin, "update", label, obj.id, f"Updated {label.lower()}: {display(obj)}")
        db.commit()
        db.refresh(obj)
        _schedule(bg)
        return obj

    @router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_item(item_id: int, bg: BackgroundTasks, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
        obj = _get(db, item_id)
        name = display(obj)
        db.delete(obj)
        _commit(db)
        log_activity(db, admin, "delete", label, item_id, f"Deleted {label.lower()}: {name}")
        db.commit()
        _schedule(bg)

    return router
