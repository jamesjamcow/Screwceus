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

## Clerk webhooks

Clerk user records are synced into the database through a signed webhook.

1. For local development, expose the API with a public tunnel such as ngrok:

```bash
ngrok http 8000
```

2. In the Clerk Dashboard, create a webhook endpoint:

```text
https://<tunnel-or-api-domain>/api/v1/webhooks/clerk
```

3. Subscribe the endpoint to these events:

```text
user.created
user.updated
```

4. Copy the endpoint signing secret into `.env`:

```bash
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```
