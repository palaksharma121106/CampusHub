import io

from docx import Document

from app.rag.chunker import chunk_pages
from app.rag.extractor import PageText as Page


def _docx_bytes(paragraphs):
    doc = Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def test_chunker_overlaps_and_keeps_pages():
    text = " ".join(f"Sentence number {i} about campus rules." for i in range(200))
    chunks = chunk_pages([Page(page_number=3, text=text)], 400, 80)
    assert len(chunks) > 1
    assert all(c.page_number == 3 and len(c.content) <= 480 for c in chunks)


def test_assistant_answers_from_structured_records(client, student_headers):
    r = client.post("/api/assistant/ask", headers=student_headers,
                    json={"question": "What are the library timings?", "input_mode": "voice"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["answered"] is True and body["sources"]
    assert body["generator"] == "extractive"
    assert body["session_id"]


def test_assistant_refuses_out_of_scope_questions(client, student_headers):
    r = client.post("/api/assistant/ask", headers=student_headers,
                    json={"question": "Who won the football world cup in 1966?"})
    body = r.json()
    assert body["answered"] is False and body["sources"] == []


def test_upload_index_query_and_delete_document(client, admin_headers, student_headers):
    content = _docx_bytes([
        "Transport Policy (test document).",
        "The campus shuttle bus named Zephyrline departs from Gate 4 every 20 minutes between 7 AM and 9 PM.",
    ])
    r = client.post("/api/admin/documents", headers=admin_headers,
                    files={"file": ("transport.docx", content,
                                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
                    data={"title": "Transport Policy", "category": "General"})
    assert r.status_code == 201, r.text
    doc_id = r.json()["id"]

    doc = client.get(f"/api/admin/documents/{doc_id}", headers=admin_headers).json()
    assert doc["status"] == "indexed" and doc["chunk_count"] >= 1

    ans = client.post("/api/assistant/ask", headers=student_headers,
                      json={"question": "When does the Zephyrline shuttle bus depart from Gate 4?"}).json()
    assert ans["answered"] is True
    assert any(s["document_id"] == doc_id for s in ans["sources"])

    r = client.post(f"/api/admin/documents/{doc_id}/reindex", headers=admin_headers)
    assert r.status_code == 200
    assert client.delete(f"/api/admin/documents/{doc_id}", headers=admin_headers).status_code == 204

    ans = client.post("/api/assistant/ask", headers=student_headers,
                      json={"question": "When does the Zephyrline shuttle bus depart from Gate 4?"}).json()
    assert all(s.get("document_id") != doc_id for s in ans["sources"])


def test_upload_rejects_invalid_files(client, admin_headers):
    r = client.post("/api/admin/documents", headers=admin_headers,
                    files={"file": ("fake.pdf", b"not really a pdf", "application/pdf")}, data={"title": "Fake"})
    assert r.status_code == 400
    r = client.post("/api/admin/documents", headers=admin_headers,
                    files={"file": ("notes.txt", b"hello", "text/plain")}, data={"title": "Text"})
    assert r.status_code == 400


def test_chat_history_sessions(client, student_headers):
    sessions = client.get("/api/assistant/sessions", headers=student_headers).json()
    assert sessions
    detail = client.get(f"/api/assistant/sessions/{sessions[0]['id']}", headers=student_headers).json()
    assert len(detail["messages"]) >= 2
