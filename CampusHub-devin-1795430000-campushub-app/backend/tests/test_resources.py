def test_public_overview_is_open(client):
    data = client.get("/api/public/overview").json()
    assert data["departments"] >= 1 and data["programs"] >= 1


def test_student_can_list_and_filter(client, student_headers):
    courses = client.get("/api/courses", headers=student_headers, params={"page_size": 100}).json()
    assert courses["total"] > 0 and {"items", "page", "page_size"} <= courses.keys()
    sem = courses["items"][0]["semester"]
    filtered = client.get("/api/courses", headers=student_headers, params={"semester": sem}).json()
    assert all(c["semester"] == sem for c in filtered["items"])

    faculty = client.get("/api/faculty", headers=student_headers, params={"q": "Professor"}).json()
    assert faculty["total"] >= 1


def test_global_search(client, student_headers):
    r = client.get("/api/search", headers=student_headers, params={"q": "library"})
    assert r.status_code == 200
    assert len(r.json()["results"]) > 0


def test_admin_crud_department(client, admin_headers):
    r = client.post("/api/departments", headers=admin_headers,
                    json={"name": "Department of Testing", "code": "TST", "hod_name": "Dr. Test"})
    assert r.status_code == 201, r.text
    dept_id = r.json()["id"]

    r = client.put(f"/api/departments/{dept_id}", headers=admin_headers, json={"hod_name": "Dr. Updated"})
    assert r.status_code == 200 and r.json()["hod_name"] == "Dr. Updated"

    dup = client.post("/api/departments", headers=admin_headers, json={"name": "Other", "code": "TST"})
    assert dup.status_code in (400, 409)

    assert client.delete(f"/api/departments/{dept_id}", headers=admin_headers).status_code == 204
    assert client.get(f"/api/departments/{dept_id}", headers=admin_headers).status_code == 404


def test_admin_crud_validation(client, admin_headers):
    r = client.post("/api/courses", headers=admin_headers, json={"code": "X1", "title": "No programme"})
    assert r.status_code == 422


def test_admin_student_management(client, admin_headers):
    r = client.post("/api/admin/students", headers=admin_headers, json={
        "full_name": "Managed Student", "email": "managed@example.com", "password": "Managed@123",
        "enrollment_no": "MGD001", "year_of_study": 1})
    assert r.status_code == 201, r.text
    uid = r.json()["id"]
    r = client.put(f"/api/admin/students/{uid}", headers=admin_headers, json={"is_active": False})
    assert r.status_code == 200 and r.json()["is_active"] is False
    login = client.post("/api/auth/login", json={"email": "managed@example.com", "password": "Managed@123"})
    assert login.status_code in (401, 403)
    assert client.delete(f"/api/admin/students/{uid}", headers=admin_headers).status_code == 204


def test_admin_stats_and_analytics(client, admin_headers):
    stats = client.get("/api/admin/stats", headers=admin_headers).json()
    assert stats["students"] >= 1 and stats["generator"] == "extractive"
    analytics = client.get("/api/admin/analytics", headers=admin_headers).json()
    assert "daily" in analytics and "top_questions" in analytics
