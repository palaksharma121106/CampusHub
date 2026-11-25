# CampusHub architecture

```
 Browser (React SPA)
   │  Web Speech API (speech → text)      SpeechSynthesis (text → speech)
   │  Axios + JWT bearer token
   ▼
 FastAPI  /api/*  ── auth · resources (CRUD) · search · assistant · admin · documents
   │                         │
   │ SQLAlchemy              │ RAG pipeline
   ▼                         ▼
 MySQL 8                 Embedder (sentence-transformers) ─► FAISS indexes (documents, records)
 (users, academics,      Generator: Gemini (optional) │ Extractive fallback
  campus, documents,
  chunks, chat, logs)    Uploads directory (PDF/DOCX)
```

## Backend modules

| Path | Responsibility |
| --- | --- |
| `app/core` | Settings (`pydantic-settings`, env vars), password hashing, JWT |
| `app/models` | SQLAlchemy models: `users`, `roles`, `students`, `departments`, `academic_programs`, `courses`, `subjects`, `syllabus`, `faculty`, `fee_structures`, `library_resources`, `campus_facilities`, `medical_facilities`, `important_contacts`, `announcements`, `uploaded_documents`, `document_chunks`, `chat_sessions`, `chat_messages`, `query_logs`, `activity_logs` |
| `app/schemas` | Pydantic request/response models and validation |
| `app/api` | Routers. `crud.py` builds list/get/create/update/delete routers for every resource; reads need a logged-in user, writes need `require_admin` |
| `app/rag` | `extractor` (pypdf, python-docx), `chunker`, `embeddings`, `vector_store` (FAISS `IndexIDMap` on disk), `records` (database rows → passages), `generator` (Gemini / extractive), `pipeline` |
| `app/services/documents.py` | Upload validation, background indexing, replacement and deletion |
| `alembic/` | Schema migrations |

## Data model (main relations)

- `departments 1─* academic_programs 1─* courses 1─* subjects`, `courses 1─* syllabus`
- `departments 1─* faculty`, `faculty 1─* subjects` (teacher)
- `academic_programs 1─* fee_structures`
- `users *─1 roles`, `users 1─1 students *─1 departments / academic_programs`
- `uploaded_documents 1─* document_chunks`
- `users 1─* chat_sessions 1─* chat_messages`, `users 1─* query_logs`

## RAG flow

1. **Ingestion.** An admin uploads a PDF/DOCX. The file is checked (extension, MIME type, magic bytes, size), stored under
   a random name and processed in a background task: text is extracted per page, split into ~900-character overlapping
   chunks, saved in `document_chunks`, embedded and added to the FAISS `documents` index using the chunk id.
2. **Structured records.** Every create/update/delete of academic or campus data rebuilds the FAISS `records` index, so
   the assistant also answers from the database (fees, faculty, timings…).
3. **Retrieval.** The question is embedded; the top candidates from both indexes are re-ranked with
   `0.65 × cosine + 0.35 × keyword overlap`. Candidates below `MIN_RELEVANCE`, or without any keyword match and only weak
   semantic similarity, are dropped.
4. **Generation.** Gemini receives only the numbered passages and is instructed to cite them and to reply with the fixed
   "not found" sentence when they do not contain the answer. Without Gemini, the extractive generator quotes the most
   relevant sentences (documents) or whole records (database).
5. **Response.** Answer text, numbered sources (title, page, excerpt, link), generator name and timing are returned and
   logged in `query_logs` for analytics.

Re-indexing a document replaces its chunks and vectors; deleting it removes the file, the chunks and the vectors. If the
FAISS files are lost (e.g. a new container), they are rebuilt from the database at start-up.

## Frontend

| Path | Responsibility |
| --- | --- |
| `src/services` | Axios client (JWT interceptor, 401 handling) and typed API functions |
| `src/context/AuthContext.tsx` | Current user, login/register/logout |
| `src/components/ProtectedRoute.tsx` | Role-based route guard |
| `src/layouts` | Public layout and the student/admin application shell |
| `src/pages/student` | Dashboard, assistant, information pages (`InfoDirectory`), search, profile |
| `src/pages/admin` | Overview (Recharts), query history, documents, CRUD pages (`ResourceManager`) |
| `src/hooks` | `useSpeechRecognition`, `useSpeechSynthesis`, `useAudioLevels` (waveform), `useAsync`, `useDebounce` |

All information pages read from the API; nothing college-specific is hard-coded in React.

## Security

- Passwords hashed with bcrypt; JWT (HS256) with expiry; inactive accounts cannot log in.
- `require_admin` on every write and admin endpoint; students can only read their own chat sessions.
- Pydantic validation on all inputs; SQLAlchemy parameterised queries.
- Upload checks: `.pdf`/`.docx` only, MIME type, magic bytes, `MAX_UPLOAD_MB`, random stored filenames.
- CORS allow-list from `CORS_ORIGINS`; generic 500 responses without stack traces.
- Gemini key, JWT secret and database credentials exist only in backend environment variables.
