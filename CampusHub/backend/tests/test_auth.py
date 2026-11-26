from app.core.config import settings


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_register_login_and_me(client):
    payload = {"full_name": "Test Student", "email": "new.student@example.com", "password": "Passw0rd!",
               "enrollment_no": "TEST001", "year_of_study": 2}
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 201, r.text
    token = r.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).json()
    assert me["email"] == "new.student@example.com" and me["role"] == "student"

    dup = client.post("/api/auth/register", json=payload)
    assert dup.status_code in (400, 409)

    r = client.post("/api/auth/login", json={"email": payload["email"], "password": "wrong-pass"})
    assert r.status_code == 401


def test_register_validates_password_strength(client):
    r = client.post("/api/auth/register", json={"full_name": "Weak", "email": "weak@example.com",
                                                "password": "password", "enrollment_no": "WEAK1"})
    assert r.status_code == 422


def test_password_is_hashed(client):
    from sqlalchemy import select

    from app.database.session import SessionLocal
    from app.models import User
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == "aarav.student@campushub.demo"))
        assert user.password_hash != "Student@123" and user.password_hash.startswith("$2")


def test_protected_routes_require_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/courses").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-jwt"}).status_code == 401


def test_student_and_admin_sessions_switch_without_role_inheritance(client):
    student = client.post("/api/auth/login", json={
        "email": "aarav.student@campushub.demo",
        "password": "Student@123",
    })
    admin = client.post("/api/auth/login", json={
        "email": settings.FIRST_ADMIN_EMAIL,
        "password": settings.FIRST_ADMIN_PASSWORD,
    })
    assert student.status_code == admin.status_code == 200
    student_token = student.json()["access_token"]
    admin_token = admin.json()["access_token"]
    assert student_token != admin_token

    student_headers = {"Authorization": f"Bearer {student_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    assert client.get("/api/auth/me", headers=student_headers).json()["role"] == "student"
    assert client.get("/api/auth/me", headers=admin_headers).json()["role"] == "admin"
    assert client.get("/api/admin/stats", headers=student_headers).status_code == 403
    assert client.get("/api/admin/stats", headers=admin_headers).status_code == 200


def test_logout_revokes_token_without_deleting_user(client):
    accounts = [
        ("aarav.student@campushub.demo", "Student@123"),
        (settings.FIRST_ADMIN_EMAIL, settings.FIRST_ADMIN_PASSWORD),
    ]
    for email, password in accounts:
        login = client.post("/api/auth/login", json={"email": email, "password": password})
        assert login.status_code == 200
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

        response = client.post("/api/auth/logout", headers=headers)
        assert response.status_code == 204
        assert client.get("/api/auth/me", headers=headers).status_code == 401

        next_login = client.post("/api/auth/login", json={"email": email, "password": password})
        assert next_login.status_code == 200
        assert client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {next_login.json()['access_token']}"},
        ).status_code == 200


def test_students_cannot_use_admin_endpoints(client, student_headers):
    assert client.get("/api/admin/stats", headers=student_headers).status_code == 403
    assert client.get("/api/admin/documents", headers=student_headers).status_code == 403
    r = client.post("/api/departments", headers=student_headers, json={"name": "X", "code": "XX"})
    assert r.status_code == 403
