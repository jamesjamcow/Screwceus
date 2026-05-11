import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.models.user import User
from app.services.user_sync import sync_user_from_clerk_payload


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
def session(engine):
    with Session(engine) as test_session:
        yield test_session


def test_sync_user_from_clerk_payload_creates_user_with_primary_email(session):
    user = sync_user_from_clerk_payload(
        {
            "id": "user_clerk_create",
            "first_name": "Ada",
            "last_name": "Lovelace",
            "image_url": "https://example.com/avatar.png",
            "primary_email_address_id": "email_primary",
            "email_addresses": [
                {"id": "email_secondary", "email_address": "secondary@example.com"},
                {"id": "email_primary", "email_address": "ada@example.com"},
            ],
        },
        session,
    )

    saved = session.exec(select(User).where(User.clerk_id == "user_clerk_create")).one()
    assert user.id == saved.id
    assert saved.email == "ada@example.com"
    assert saved.display_name == "Ada Lovelace"
    assert saved.avatar_url == "https://example.com/avatar.png"


def test_sync_user_from_clerk_payload_falls_back_to_first_email_and_username(session):
    user = sync_user_from_clerk_payload(
        {
            "id": "user_clerk_fallback",
            "username": "fallback_user",
            "primary_email_address_id": "missing",
            "email_addresses": [{"id": "email_first", "email_address": "first@example.com"}],
        },
        session,
    )

    assert user.email == "first@example.com"
    assert user.display_name == "fallback_user"


def test_sync_user_from_clerk_payload_falls_back_to_email_local_part(session):
    user = sync_user_from_clerk_payload(
        {
            "id": "user_clerk_local_part",
            "email_addresses": [{"id": "email_first", "email_address": "local@example.com"}],
        },
        session,
    )

    assert user.email == "local@example.com"
    assert user.display_name == "local"


def test_sync_user_from_clerk_payload_updates_existing_user(session):
    existing = User(
        clerk_id="user_clerk_update",
        email="old@example.com",
        display_name="Old Name",
        avatar_url="https://example.com/old.png",
    )
    session.add(existing)
    session.commit()

    user = sync_user_from_clerk_payload(
        {
            "id": "user_clerk_update",
            "first_name": "New",
            "last_name": "Name",
            "profile_image_url": "https://example.com/new.png",
            "email_addresses": [{"id": "email_first", "email_address": "new@example.com"}],
        },
        session,
    )

    assert user.id == existing.id
    assert user.email == "new@example.com"
    assert user.display_name == "New Name"
    assert user.avatar_url == "https://example.com/new.png"


def test_sync_user_from_clerk_payload_handles_concurrent_create_conflict(monkeypatch, session, engine):
    original_commit = session.commit
    attempts = 0

    def commit_with_conflict_once():
        nonlocal attempts
        if attempts == 0:
            attempts += 1
            with Session(engine) as other_session:
                other_session.add(User(clerk_id="user_clerk_race", email="winner@example.com"))
                other_session.commit()
            raise IntegrityError("insert", {}, Exception("unique constraint"))

        return original_commit()

    monkeypatch.setattr(session, "commit", commit_with_conflict_once)

    user = sync_user_from_clerk_payload(
        {
            "id": "user_clerk_race",
            "first_name": "Race",
            "last_name": "Winner",
            "email_addresses": [{"id": "email_first", "email_address": "race@example.com"}],
        },
        session,
    )

    users = session.exec(select(User).where(User.clerk_id == "user_clerk_race")).all()
    assert len(users) == 1
    assert user.email == "race@example.com"
    assert user.display_name == "Race Winner"
