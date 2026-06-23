from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session
from svix.webhooks import Webhook, WebhookVerificationError

from app.core.config import settings
from app.db.session import get_session
from app.services.user_sync import sync_user_from_clerk_payload
from app.services.organization_sync import sync_organization_from_clerk_payload

router = APIRouter()


@router.post("/clerk")
async def handle_clerk_webhook(
    request: Request,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    if not settings.clerk_webhook_signing_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Clerk webhook signing secret is not configured",
        )

    payload = await request.body()
    headers = dict(request.headers)

    try:
        event = Webhook(settings.clerk_webhook_signing_secret).verify(payload, headers)
    except WebhookVerificationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature",
        ) from exc

    event_type = event.get("type")
    if event_type in {"user.created", "user.updated"}:
        sync_user_from_clerk_payload(event.get("data") or {}, session)
    elif event_type in {"organization.created", "organization.updated"}:
        sync_organization_from_clerk_payload(event.get("data") or {}, session)

    return {"status": "ok"}
