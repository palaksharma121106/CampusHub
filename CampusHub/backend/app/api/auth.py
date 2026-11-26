from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.database.session import get_db
from app.models import AcademicProgram, Department, Role, Student, User
from app.schemas.auth import LoginRequest, PasswordChange, ProfileUpdate, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def to_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id, email=user.email, full_name=user.full_name, role=user.role_name,
        is_active=user.is_active, created_at=user.created_at, student=user.student,
    )


def _authenticate(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email.lower().strip()))
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been deactivated")
    return user


def _validate_refs(db: Session, department_id: int | None, program_id: int | None):
    if department_id is not None and not db.get(Department, department_id):
        raise HTTPException(status_code=400, detail="Selected department does not exist")
    if program_id is not None and not db.get(AcademicProgram, program_id):
        raise HTTPException(status_code=400, detail="Selected programme does not exist")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    if db.scalar(select(Student.id).where(Student.enrollment_no == payload.enrollment_no.upper())):
        raise HTTPException(status_code=409, detail="This enrollment number is already registered")
    _validate_refs(db, payload.department_id, payload.program_id)
    role = db.scalar(select(Role).where(Role.name == "student"))
    if role is None:
        raise HTTPException(status_code=500, detail="Roles are not initialised; run the database seed")
    user = User(email=email, full_name=payload.full_name.strip(), password_hash=hash_password(payload.password), role_id=role.id)
    user.student = Student(
        enrollment_no=payload.enrollment_no.upper(), department_id=payload.department_id,
        program_id=payload.program_id, year_of_study=payload.year_of_study, phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id, user.role_name, user.token_version),
        user=to_user_out(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = _authenticate(db, payload.email, payload.password)
    return TokenResponse(
        access_token=create_access_token(user.id, user.role_name, user.token_version),
        user=to_user_out(user),
    )


@router.post("/token", include_in_schema=True)
def token(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 password flow (used by the Swagger 'Authorize' button)."""
    user = _authenticate(db, form.username, form.password)
    return {
        "access_token": create_access_token(user.id, user.role_name, user.token_version),
        "token_type": "bearer",
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.token_version += 1
    db.commit()


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return to_user_out(user)


@router.put("/me", response_model=UserOut)
def update_me(payload: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    if "full_name" in data and data["full_name"]:
        user.full_name = data.pop("full_name").strip()
    else:
        data.pop("full_name", None)
    if user.student:
        _validate_refs(db, data.get("department_id"), data.get("program_id"))
        for key, value in data.items():
            setattr(user.student, key, value)
    db.commit()
    db.refresh(user)
    return to_user_out(user)


@router.post("/change-password", status_code=204)
def change_password(payload: PasswordChange, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
