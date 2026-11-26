# Deploying CampusHub

CampusHub has three parts: the static React build, the FastAPI backend, and MySQL. The backend also needs **persistent
storage** for uploaded files (`UPLOAD_DIR`) and FAISS indexes (`INDEX_DIR`).

## Option A – one server with Docker Compose

Suitable for a college server or a single VM (e.g. AWS EC2, DigitalOcean).

```bash
git clone <repo> campushub && cd campushub
cp .env.example .env    # set strong MYSQL_*, JWT_SECRET_KEY, FIRST_ADMIN_PASSWORD, CORS_ORIGINS, GEMINI_API_KEY
docker compose up -d --build
```

Put a reverse proxy with HTTPS (Caddy, nginx + Let's Encrypt) in front of port 8080. HTTPS is required for microphone
access in browsers. Named volumes `mysql-data`, `uploads` and `rag-data` keep data across restarts; back them up.

## Option B – managed services

| Part | Example platforms | Notes |
| --- | --- | --- |
| Frontend | Vercel, Netlify | Root `frontend`, build `npm run build`, output `dist`. Set `VITE_API_URL=https://<backend-host>`. Add a SPA rewrite of all paths to `/index.html` (Vercel: `vercel.json` with `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`) |
| Backend | Render, Railway, Fly.io, Azure App Service | Use `backend/Dockerfile`. Attach a persistent disk mounted at `/app/uploads` and `/app/data`. ≥1 GB RAM for the embedding model |
| Database | Railway MySQL, Aiven, PlanetScale-compatible MySQL, AWS RDS | Set `DATABASE_URL=mysql+pymysql://user:pass@host:3306/campushub` (add `?ssl_verify_cert=true` options as required by the provider) |

Backend environment variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLAlchemy URL for MySQL |
| `JWT_SECRET_KEY` | Long random secret (required) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime (default 1440) |
| `CORS_ORIGINS` | Comma-separated frontend origins, e.g. `https://campushub.vercel.app` |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Optional Gemini generation |
| `FIRST_ADMIN_EMAIL`, `FIRST_ADMIN_PASSWORD` | Initial admin created by the seed command |
| `UPLOAD_DIR`, `INDEX_DIR` | Paths on persistent storage |
| `MAX_UPLOAD_MB` | Upload size limit (default 20) |

The container command runs `alembic upgrade head`, the seed (skipped when data exists) and the sample-document loader
before starting Uvicorn. For a production institution, remove the demo seed step and enter real data in the admin portal.

## Production checklist

- [ ] Strong `JWT_SECRET_KEY`, database and admin passwords; demo accounts removed or changed
- [ ] HTTPS on both frontend and API; `CORS_ORIGINS` limited to the real frontend origin
- [ ] Persistent volumes for MySQL, uploads and FAISS indexes, with backups
- [ ] `GEMINI_API_KEY` stored in the platform's secret manager, never in the frontend
- [ ] Demo data replaced with verified institutional information
