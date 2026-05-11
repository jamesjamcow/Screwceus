import json
from datetime import datetime, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select
from svix.webhooks import Webhook

from app.api.v1.webhooks import router
from app.core.config import settings
from app.db.session import get_session
from app.models.user import User

WEBHOOK_SECRET = "whsec_test_secret"


@pytest.fixture()
def engine():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(test_engine)
    return test_engine


@pytest.fixture()
def client(monkeypatch, engine):
    app = FastAPI()
    app.include_router(router, prefix="/api/v1/webhooks")
    monkeypatch.setattr(settings, "clerk_webhook_signing_secret", WEBHOOK_SECRET)

    def override_get_session():
        with Session(engine) as test_session:
            yield test_session

    app.dependency_overrides[get_session] = override_get_session
    return TestClient(app)


def test_clerk_webhook_creates_user(client, engine):
    response = client.post(
        "/api/v1/webhooks/clerk",
        content=_body(
            {
                "type": "user.created",
                "data": {
                    "id": "user_webhook_create",
                    "first_name": "Webhook",
                    "last_name": "Create",
                    "image_url": "https://example.com/webhook.png",
                    "email_addresses": [{"id": "email_1", "email_address": "webhook@example.com"}],
                },
            }
        ),
        headers=_headers(
            {
                "type": "user.created",
                "data": {
                    "id": "user_webhook_create",
                    "first_name": "Webhook",
                    "last_name": "Create",
                    "image_url": "https://example.com/webhook.png",
                    "email_addresses": [{"id": "email_1", "email_address": "webhook@example.com"}],
                },
            }
        ),
    )

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    with Session(engine) as session:
        user = session.exec(select(User).where(User.clerk_id == "user_webhook_create")).one()
        assert user.email == "webhook@example.com"
        assert user.display_name == "Webhook Create"


def test_clerk_webhook_updates_user(client, engine):
    with Session(engine) as session:
        session.add(User(clerk_id="user_webhook_update", email="old@example.com", display_name="Old"))
        session.commit()

    event = {
        "type": "user.updated",
        "data": {
            "id": "user_webhook_update",
            "first_name": "Updated",
            "last_name": "User",
            "profile_image_url": "https://example.com/updated.png",
            "email_addresses": [{"id": "email_1", "email_address": "updated@example.com"}],
        },
    }
    body = _body(event)
    response = client.post("/api/v1/webhooks/clerk", content=body, headers=_headers_for_body(body))

    assert response.status_code == 200
    with Session(engine) as session:
        user = session.exec(select(User).where(User.clerk_id == "user_webhook_update")).one()
        assert user.email == "updated@example.com"
        assert user.display_name == "Updated User"
        assert user.avatar_url == "https://example.com/updated.png"


def test_clerk_webhook_ignores_unrelated_valid_event(client, engine):
    event = {"type": "session.created", "data": {"id": "sess_1"}}
    body = _body(event)
    response = client.post("/api/v1/webhooks/clerk", content=body, headers=_headers_for_body(body))

    assert response.status_code == 200
    with Session(engine) as session:
        assert session.exec(select(User)).all() == []


def test_clerk_webhook_rejects_missing_signature(client, engine):
    response = client.post("/api/v1/webhooks/clerk", content=_body({"type": "user.created", "data": {}}))

    assert response.status_code == 401
    with Session(engine) as session:
        assert session.exec(select(User)).all() == []


def test_clerk_webhook_rejects_invalid_signature(client, engine):
    body = _body({"type": "user.created", "data": {"id": "user_invalid"}})
    response = client.post(
        "/api/v1/webhooks/clerk",
        content=body,
        headers={
            "svix-id": "msg_invalid",
            "svix-timestamp": "1700000000",
            "svix-signature": "v1,invalid",
        },
    )

    assert response.status_code == 401
    with Session(engine) as session:
        assert session.exec(select(User)).all() == []


def _body(event: dict) -> str:
    return json.dumps(event, separators=(",", ":"))


def _headers(event: dict) -> dict[str, str]:
    return _headers_for_body(_body(event))


def _headers_for_body(body: str) -> dict[str, str]:
    msg_id = "msg_test"
    timestamp = datetime.now(timezone.utc)
    signature = Webhook(WEBHOOK_SECRET).sign(msg_id, timestamp, body)
    return {
        "svix-id": msg_id,
        "svix-timestamp": str(int(timestamp.timestamp())),
        "svix-signature": signature,
    }
