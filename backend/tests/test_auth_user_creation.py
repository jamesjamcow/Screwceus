import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.core import security
from app.db.session import get_session
from app.models.user import User


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


def test_get_current_user_creates_user(session):
    user = security.get_current_user(
        {
            "sub": "user_create",
            "email": "create@example.com",
            "name": "Create User",
            "image_url": "https://example.com/create.png",
        },
        session,
    )

    saved = session.exec(select(User).where(User.clerk_id == "user_create")).one()
    assert user.id == saved.id
    assert saved.email == "create@example.com"
    assert saved.display_name == "Create User"
    assert saved.avatar_url == "https://example.com/create.png"


def test_get_current_user_reuses_existing_user(session):
    existing = User(clerk_id="user_existing", email="existing@example.com")
    session.add(existing)
    session.commit()

    user = security.get_current_user({"sub": "user_existing"}, session)
    users = session.exec(select(User).where(User.clerk_id == "user_existing")).all()

    assert user.id == existing.id
    assert len(users) == 1


def test_get_current_user_syncs_changed_profile_fields(session):
    existing = User(
        clerk_id="user_sync",
        email="old@example.com",
        display_name="Old Name",
        avatar_url="https://example.com/old.png",
    )
    session.add(existing)
    session.commit()

    user = security.get_current_user(
        {
            "sub": "user_sync",
            "email": "new@example.com",
            "name": "New Name",
            "picture": "https://example.com/new.png",
        },
        session,
    )

    assert user.email == "new@example.com"
    assert user.display_name == "New Name"
    assert user.avatar_url == "https://example.com/new.png"


def test_get_current_user_id_dependency_creates_user(engine):
    app = FastAPI()

    def override_verify_clerk_token():
        return {
            "sub": "user_dependency",
            "email": "dependency@example.com",
            "name": "Dependency User",
        }

    def override_get_session():
        with Session(engine) as test_session:
            yield test_session

    @app.get("/protected")
    def protected(user_id: str = Depends(security.get_current_user_id)):
        return {"user_id": user_id}

    app.dependency_overrides[security.verify_clerk_token] = override_verify_clerk_token
    app.dependency_overrides[get_session] = override_get_session

    response = TestClient(app).get("/protected")

    assert response.status_code == 200
    assert response.json() == {"user_id": "user_dependency"}
    with Session(engine) as verify_session:
        user = verify_session.exec(select(User).where(User.clerk_id == "user_dependency")).one()
        assert user.email == "dependency@example.com"


def test_get_current_user_handles_concurrent_create_conflict(monkeypatch, session, engine):
    original_commit = session.commit
    attempts = 0

    def commit_with_conflict_once():
        nonlocal attempts
        if attempts == 0:
            attempts += 1
            with Session(engine) as other_session:
                other_session.add(
                    User(
                        clerk_id="user_race",
                        email="winner@example.com",
                        display_name="Winner",
                    )
                )
                other_session.commit()
            raise IntegrityError("insert", {}, Exception("unique constraint"))

        return original_commit()

    monkeypatch.setattr(session, "commit", commit_with_conflict_once)

    user = security.get_current_user(
        {
            "sub": "user_race",
            "email": "race@example.com",
            "name": "Race User",
            "image_url": "https://example.com/race.png",
        },
        session,
    )

    users = session.exec(select(User).where(User.clerk_id == "user_race")).all()
    assert len(users) == 1
    assert user.email == "race@example.com"
    assert user.display_name == "Race User"
    assert user.avatar_url == "https://example.com/race.png"
