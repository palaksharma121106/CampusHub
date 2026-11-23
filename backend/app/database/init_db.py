"""Create tables (for local/dev use; production uses Alembic migrations) and the base roles + first admin."""
from sqlalchemy import select

from app import models  # noqa: F401  (register models)
from app.core.config import settings
from app.core.security import hash_password
from app.database.session import Base, SessionLocal, engine
from app.models import Role, User


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


def ensure_roles_and_admin(db) -> User:
    roles = {}
    for name, desc in (("admin", "College administrator"), ("student", "Registered student")):
        role = db.scalar(select(Role).where(Role.name == name))
        if not role:
            role = Role(name=name, description=desc)
            db.add(role)
            db.flush()
        roles[name] = role
    admin = db.scalar(select(User).where(User.email == settings.FIRST_ADMIN_EMAIL))
    if not admin:
        admin = User(email=settings.FIRST_ADMIN_EMAIL, full_name="Campus Administrator",
                     password_hash=hash_password(settings.FIRST_ADMIN_PASSWORD), role_id=roles["admin"].id)
        db.add(admin)
    db.commit()
    return admin


if __name__ == "__main__":
    create_tables()
    with SessionLocal() as session:
        ensure_roles_and_admin(session)
    print("Tables, roles and first admin are ready.")
