FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 \
    HF_HOME=/app/data/hf-cache
WORKDIR /app

# CPU-only PyTorch keeps the image small; sentence-transformers pulls it in otherwise.
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.5.1
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN useradd --create-home --uid 1000 campushub && mkdir -p uploads data && chown -R campushub /app
USER campushub

EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && python -m app.database.seed && python -m app.database.load_samples /app/sample-documents; exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers"]
