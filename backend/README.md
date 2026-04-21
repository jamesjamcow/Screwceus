# Backend (FastAPI + SQLModel + Alembic)

## Quick start

1. Create a virtual environment and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Run migrations:

```bash
alembic upgrade head
```

4. Start API server:

```bash
uvicorn app.main:app --reload --port 8000
```
