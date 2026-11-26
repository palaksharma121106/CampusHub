# CampusHub – Intelligent Voice-Based College Information Assistant

CampusHub is a full-stack web application that brings a college's academic and campus information into one place and lets
students ask questions by **voice or text**. Answers come from a **retrieval-augmented generation (RAG)** pipeline over
the institution's uploaded PDF/DOCX documents and its structured database records, with numbered source references.

> **Demonstration data.** Everything shipped in this repository (departments, faculty, fees, documents, …) is fictional
> sample data for the placeholder *Demo Institute of Technology*. It is **not** official information of any real
> institution. Replace it through the admin portal before using CampusHub for real students.

## Features

| Area | What it does |
| --- | --- |
| Student portal | Registration/login (JWT), dashboard, global search, programmes, departments, courses, subjects, syllabus, faculty, fees, library, medical, hostels, campus services, contacts, announcements, profile |
| AI voice assistant | Web Speech API recognition (`en-IN`), live waveform, listening/processing/speaking states, text fallback, spoken answers (SpeechSynthesis) with stop, chat history, suggestions, cited sources |
| RAG | PDF/DOCX extraction → chunking → Sentence-Transformers embeddings → FAISS; hybrid (vector + keyword) retrieval over documents **and** database records; Gemini generation with an extractive, quote-only fallback; explicit "not found" answers |
| Admin portal | Dashboard with charts, query history, CRUD for all academic/campus data and students, document upload with status/re-index/delete |
| Security | bcrypt password hashing, JWT with per-user logout revocation, role-based access (student/admin), Pydantic validation, PDF/DOCX extension + magic-byte checks and size limit, CORS allow-list, secrets only on the server |

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui-style components (Radix), Lucide, Framer Motion, React Router, Axios, Recharts
- **Backend:** FastAPI, SQLAlchemy 2, Alembic, MySQL 8, python-jose, bcrypt
- **AI:** sentence-transformers (`all-MiniLM-L6-v2`), FAISS, Google Gemini (`google-genai`), pypdf, python-docx

## Repository layout

```
backend/    FastAPI app (app/api, app/models, app/schemas, app/rag, app/services), Alembic migrations, pytest tests
frontend/   React app (src/pages, src/components, src/hooks, src/services), Vitest tests
database/   schema.sql and seed.sql (standalone MySQL scripts)
docs/       architecture, deployment guide, sample demo documents
```

## Quick start with Docker

```bash
cp .env.example .env          # set JWT_SECRET_KEY (and GEMINI_API_KEY if you have one)
docker compose up --build
```

For a new database, also set unique `FIRST_ADMIN_EMAIL` and `FIRST_ADMIN_PASSWORD` values in `.env` before starting.
Open http://localhost:8080. The backend container runs migrations, loads the demo data and indexes the sample documents on
first start. API docs: http://localhost:8000/docs.

## Local development (VS Code)

Prerequisites: Python 3.10+, Node 20+, MySQL 8 (or `docker compose up mysql`).

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # adjust DATABASE_URL / GEMINI_API_KEY
alembic upgrade head                                  # create tables
python -m app.database.seed                           # demo data + admin account
python -m app.database.load_samples                   # index docs/sample-documents
uvicorn app.main:app --reload --port 8000

# Frontend (second terminal)
cd frontend
npm install
npm run dev                                           # http://localhost:5173 (proxies /api to :8000)
```

Instead of Alembic you can load the standalone scripts: `mysql -u campushub -p campushub < database/schema.sql` and
`database/seed.sql`.

### Initial administrator

Set `FIRST_ADMIN_EMAIL` and `FIRST_ADMIN_PASSWORD` to your own values before initializing a new database. CampusHub does
not display or automatically fill administrator credentials in the frontend. Existing administrator accounts and
passwords are not changed by this setting.

## Gemini and the fallback

Set `GEMINI_API_KEY` on the **backend** to have Gemini write answers from the retrieved passages. Without a key (or if the
API fails) CampusHub uses an extractive generator that only quotes retrieved text. In both modes, a question with no
relevant source returns: *"I couldn't find this in CampusHub's official records…"*.

## Voice support

Speech recognition uses the browser Web Speech API, available in Chrome and Edge (desktop and Android). Other browsers
show a notice and the text input keeps working. The microphone needs HTTPS (or `localhost`).

## Tests

```bash
cd backend && python -m pytest          # API, auth/RBAC, CRUD, upload → index → answer → delete, refusals
cd frontend && npm run test             # components, routing guards, login, voice detection
cd frontend && npm run typecheck && npm run lint && npm run build
```

Backend tests use an isolated SQLite database and an offline hashing embedder, so they need neither MySQL nor a model download.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
