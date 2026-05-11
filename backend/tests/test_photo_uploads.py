from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

import app.api.v1.photos as photos_api
from app.api.v1.photos import router as photos_router
from app.core import security
from app.core.config import settings
from app.db import base  # noqa: F401
from app.db.session import get_session
from app.models.photo import Photo
from app.models.project_file import ProjectFile
from app.models.project_screenshot import ProjectScreenshot
from app.models.user import User
from app.services.uploadthing import UploadThingFile


def test_upload_photo_creates_photo_with_uploadthing_url(monkeypatch):
    upload_calls = []

    async def fake_upload_file_to_uploadthing(**kwargs):
        upload_calls.append(kwargs)
        return UploadThingFile(
            name=kwargs["filename"],
            url="https://screwceus.ufs.sh/f/generated-panel-key",
            key="generated-panel-key",
        )

    monkeypatch.setattr(photos_api, "upload_file_to_uploadthing", fake_upload_file_to_uploadthing)
    client, engine = _client(monkeypatch)

    response = client.post(
        "/api/v1/photos/upload",
        data={"title": "Panel detail"},
        files={"file": ("panel.png", b"fake-png", "image/png")},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["photo"]["title"] == "Panel detail"
    assert payload["photo"]["image_url"] == "https://screwceus.ufs.sh/f/generated-panel-key"
    assert payload["screenshot"] is None
    assert upload_calls == [
        {
            "content": b"fake-png",
            "filename": "panel.png",
            "content_type": "image/png",
        }
    ]

    with Session(engine) as session:
        photo = session.exec(select(Photo).where(Photo.id == payload["photo"]["id"])).one()
        assert photo.owner_id == "user_photo"
        assert photo.image_url == payload["photo"]["image_url"]


def test_upload_photo_with_project_id_creates_photo_and_project_screenshot(monkeypatch):
    async def fake_upload_file_to_uploadthing(**kwargs):
        return UploadThingFile(
            name=kwargs["filename"],
            url="https://screwceus.ufs.sh/f/project-panel-key",
            key="project-panel-key",
        )

    monkeypatch.setattr(photos_api, "upload_file_to_uploadthing", fake_upload_file_to_uploadthing)
    client, engine = _client(monkeypatch)

    with Session(engine) as session:
        project = ProjectFile(owner_id="user_photo", name="Merlin Panel", description="")
        session.add(project)
        session.commit()
        session.refresh(project)
        project_id = project.id

    response = client.post(
        "/api/v1/photos/upload",
        data={"title": "Panel detail", "project_id": str(project_id), "caption": "Panel detail", "sort_order": "7"},
        files={"file": ("panel.png", b"fake-png", "image/png")},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["photo"]["title"] == "Panel detail"
    assert payload["screenshot"]["project_file_id"] == project_id
    assert payload["screenshot"]["caption"] == "Panel detail"
    assert payload["screenshot"]["sort_order"] == 7
    assert payload["screenshot"]["photo_id"] == payload["photo"]["id"]

    with Session(engine) as session:
        photo = session.exec(select(Photo).where(Photo.id == payload["photo"]["id"])).one()
        screenshot = session.exec(
            select(ProjectScreenshot).where(ProjectScreenshot.id == payload["screenshot"]["id"])
        ).one()
        assert photo.owner_id == "user_photo"
        assert screenshot.owner_id == "user_photo"
        assert screenshot.project_file_id == project_id
        assert screenshot.photo_id == photo.id


def test_upload_photo_with_invalid_project_id_returns_404(monkeypatch):
    client, engine = _client(monkeypatch)

    response = client.post(
        "/api/v1/photos/upload",
        data={"project_id": "999999"},
        files={"file": ("panel.png", b"fake-png", "image/png")},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"

    with Session(engine) as session:
        assert session.exec(select(Photo)).all() == []
        assert session.exec(select(ProjectScreenshot)).all() == []


def test_upload_photo_with_other_users_project_returns_404(monkeypatch):
    client, engine = _client(monkeypatch)

    with Session(engine) as session:
        session.add(User(clerk_id="other_user", email="other@example.com"))
        session.commit()
        project = ProjectFile(owner_id="other_user", name="Other Project", description="")
        session.add(project)
        session.commit()
        session.refresh(project)
        project_id = project.id

    response = client.post(
        "/api/v1/photos/upload",
        data={"project_id": str(project_id)},
        files={"file": ("panel.png", b"fake-png", "image/png")},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"

    with Session(engine) as session:
        assert session.exec(select(Photo)).all() == []
        assert session.exec(select(ProjectScreenshot)).all() == []


def test_upload_photo_rejects_unsupported_mime_type(monkeypatch):
    client, _engine = _client(monkeypatch)

    response = client.post(
        "/api/v1/photos/upload",
        files={"file": ("note.txt", b"hello", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported image type"


def test_upload_photo_rejects_empty_file(monkeypatch):
    client, _engine = _client(monkeypatch)

    response = client.post(
        "/api/v1/photos/upload",
        files={"file": ("empty.png", b"", "image/png")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Empty upload"


def test_upload_photo_rejects_oversized_file(monkeypatch):
    client, _engine = _client(monkeypatch, max_bytes=3)

    response = client.post(
        "/api/v1/photos/upload",
        files={"file": ("large.png", b"larger", "image/png")},
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "Image is too large"


def test_upload_photo_requires_auth(monkeypatch):
    client, _engine = _client(monkeypatch, authenticated=False)

    response = client.post(
        "/api/v1/photos/upload",
        files={"file": ("panel.png", b"fake-png", "image/png")},
    )

    assert response.status_code == 401


def _client(monkeypatch, authenticated=True, max_bytes=10 * 1024 * 1024):
    monkeypatch.setattr(settings, "max_image_upload_bytes", max_bytes)

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        session.add(User(clerk_id="user_photo", email="photo@example.com"))
        session.commit()

    app = FastAPI()
    app.include_router(photos_router, prefix="/api/v1/photos")

    def override_get_session():
        with Session(engine) as test_session:
            yield test_session

    app.dependency_overrides[get_session] = override_get_session

    if authenticated:
        app.dependency_overrides[security.get_current_user_id] = lambda: "user_photo"

    return TestClient(app), engine
