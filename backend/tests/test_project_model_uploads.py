from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

import app.api.v1.project_files as project_files_api
from app.api.v1.project_files import router as projects_router
from app.core import security
from app.core.config import settings
from app.core.security import OrganizationContext
from app.db import base  # noqa: F401
from app.db.session import get_session
from app.models.project_file import ProjectFile
from app.models.user import User
from app.services.uploadthing import UploadThingFile


def test_upload_project_model_stores_uploadthing_link(monkeypatch):
    upload_calls = []

    async def fake_upload_file_to_uploadthing(**kwargs):
        upload_calls.append(kwargs)
        return UploadThingFile(
            name=kwargs["filename"],
            url="https://screwceus.ufs.sh/f/project-model-key",
            key="project-model-key",
        )

    monkeypatch.setattr(project_files_api, "upload_file_to_uploadthing", fake_upload_file_to_uploadthing)
    client, engine = _client(monkeypatch)
    project_id = _create_project(engine)

    response = client.post(
        f"/api/v1/projects/{project_id}/model",
        files={"file": ("assembly.glb", b"fake-glb", "model/gltf-binary")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["model_url"] == "https://screwceus.ufs.sh/f/project-model-key"
    assert payload["model_filename"] == "assembly.glb"
    assert payload["model_file_key"] == "project-model-key"
    assert upload_calls == [
        {
            "content": b"fake-glb",
            "filename": "assembly.glb",
            "content_type": "model/gltf-binary",
        }
    ]

    with Session(engine) as session:
        project = session.exec(select(ProjectFile).where(ProjectFile.id == project_id)).one()
        assert project.model_url == payload["model_url"]
        assert project.model_filename == "assembly.glb"
        assert project.model_file_key == "project-model-key"


def test_upload_project_model_rejects_unsupported_file(monkeypatch):
    client, engine = _client(monkeypatch)
    project_id = _create_project(engine)

    response = client.post(
        f"/api/v1/projects/{project_id}/model",
        files={"file": ("notes.txt", b"not-a-model", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported 3D model type"


def test_create_project_initializes_model_fields(monkeypatch):
    client, _engine = _client(monkeypatch)

    response = client.post(
        "/api/v1/projects/",
        json={"name": "Merlin Panel", "description": "Test project"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["model_url"] == ""
    assert payload["model_filename"] == ""
    assert payload["model_file_key"] == ""


def _create_project(engine):
    with Session(engine) as session:
        project = ProjectFile(
            owner_id="user_project",
            organization_id="org_project",
            name="Merlin Panel",
            description="",
        )
        session.add(project)
        session.commit()
        session.refresh(project)
        return project.id


def _client(monkeypatch, authenticated=True, max_bytes=50 * 1024 * 1024):
    monkeypatch.setattr(settings, "max_model_upload_bytes", max_bytes)

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        session.add(User(clerk_id="user_project", email="project@example.com"))
        session.commit()

    app = FastAPI()
    app.include_router(projects_router, prefix="/api/v1/projects")

    def override_get_session():
        with Session(engine) as test_session:
            yield test_session

    app.dependency_overrides[get_session] = override_get_session

    if authenticated:
        app.dependency_overrides[security.get_organization_context] = lambda: OrganizationContext(
            user_id="user_project",
            organization_id="org_project",
            organization_slug="project-workspace",
            organization_role="admin",
        )

    return TestClient(app), engine
