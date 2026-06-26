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

## Clerk Organizations

Screwceus uses Clerk Organizations as the workspace/tenant boundary. In the Clerk Dashboard:

1. Enable **Organizations** and require organization membership.
2. Keep personal accounts disabled for the application workspace flow.
3. Users can then create and switch organizations from the application sidebar.

Every workspace API request is authorized from the active organization claim in Clerk's signed session token. Application teams are stored in the Screwceus database because they are nested inside a Clerk Organization.

### Paid team creation

Team creation uses Clerk Billing's active Organization Plan from the signed session token. The default `free` plan can use the General team; any paid Organization Plan can create additional teams. Add `CLERK_SECRET_KEY` to the backend environment so selected team members can be verified against Clerk before team memberships are created.

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
organization.created
organization.updated
```

4. Copy the endpoint signing secret into `.env`:

```bash
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```
