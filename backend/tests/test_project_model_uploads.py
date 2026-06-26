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
from app.models.part import Part
from app.models.project_file import ProjectFile
from app.models.project_part import ProjectPart
from app.models.team import Team, TeamMembership
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
        json={
            "name": "Merlin Panel",
            "description": "Test project",
            "status": "in_progress",
            "due_date": "2026-07-15",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["model_url"] == ""
    assert payload["model_filename"] == ""
    assert payload["model_file_key"] == ""
    assert payload["status"] == "in_progress"
    assert payload["due_date"] == "2026-07-15"
    assert payload["cover_image_url"] == ""


def test_create_project_requires_only_a_non_blank_name(monkeypatch):
    client, _ = _client(monkeypatch)

    response = client.post(
        "/api/v1/projects/",
        json={
            "name": "  Minimal project  ",
            "folder_id": None,
            "description": None,
            "status": None,
            "due_date": None,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["name"] == "Minimal project"
    assert payload["folder_id"] is None
    assert payload["description"] == ""
    assert payload["status"] == "planned"
    assert payload["due_date"] is None

    blank_name_response = client.post("/api/v1/projects/", json={"name": "   "})
    assert blank_name_response.status_code == 422


def test_update_project_persists_overview_fields(monkeypatch):
    client, engine = _client(monkeypatch)
    project_id = _create_project(engine)

    response = client.patch(
        f"/api/v1/projects/{project_id}",
        json={
            "name": "Revised Merlin Panel",
            "description": "Final assembly notes and owner context.",
            "status": "on_hold",
            "due_date": "2026-08-20",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["name"] == "Revised Merlin Panel"
    assert payload["description"] == "Final assembly notes and owner context."
    assert payload["status"] == "on_hold"
    assert payload["due_date"] == "2026-08-20"

    with Session(engine) as session:
        project = session.exec(select(ProjectFile).where(ProjectFile.id == project_id)).one()
        assert project.name == "Revised Merlin Panel"
        assert project.description == "Final assembly notes and owner context."
        assert project.status == "on_hold"
        assert project.due_date.isoformat() == "2026-08-20"


def test_project_part_labels_persist_model_points(monkeypatch):
    client, engine = _client(monkeypatch)
    project_id = _create_project(engine)
    other_project_id = _create_project(engine)

    with Session(engine) as session:
        part = Part(
            owner_id="user_project",
            organization_id="org_project",
            name="Drive screw",
            type="fastener",
            dimensions={"thread": "M4", "length": "40mm"},
            notes="Primary chassis fastener.",
        )
        session.add(part)
        session.commit()
        session.refresh(part)
        part_id = part.id

    created = client.post(
        f"/api/v1/projects/{project_id}/parts",
        json={
            "part_id": part_id,
            "point": [0.12, 0.34, 0.56],
            "notes": "Upper left label",
        },
    )

    assert created.status_code == 201
    created_payload = created.json()
    assert created_payload["project_file_id"] == project_id
    assert created_payload["part_id"] == part_id
    assert created_payload["point"] == [0.12, 0.34, 0.56]
    assert client.get(f"/api/v1/projects/{other_project_id}/parts").json() == []

    updated = client.patch(
        f"/api/v1/projects/{project_id}/parts/{created_payload['id']}",
        json={"point": [0.2, 0.4, 0.6]},
    )

    assert updated.status_code == 200
    assert updated.json()["point"] == [0.2, 0.4, 0.6]

    with Session(engine) as session:
        link = session.exec(select(ProjectPart).where(ProjectPart.id == created_payload["id"])).one()
        assert link.project_file_id == project_id
        assert link.part_id == part_id
        assert link.point == [0.2, 0.4, 0.6]


def test_upload_project_cover_stores_uploadthing_link(monkeypatch):
    upload_calls = []

    async def fake_upload_file_to_uploadthing(**kwargs):
        upload_calls.append(kwargs)
        return UploadThingFile(
            name=kwargs["filename"],
            url="https://screwceus.ufs.sh/f/project-cover-key",
            key="project-cover-key",
        )

    monkeypatch.setattr(project_files_api, "upload_file_to_uploadthing", fake_upload_file_to_uploadthing)
    client, engine = _client(monkeypatch)
    project_id = _create_project(engine)

    response = client.post(
        f"/api/v1/projects/{project_id}/cover",
        files={"file": ("cover.webp", b"fake-webp", "image/webp")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["cover_image_url"] == "https://screwceus.ufs.sh/f/project-cover-key"
    assert payload["cover_image_filename"] == "cover.webp"
    assert payload["cover_image_file_key"] == "project-cover-key"
    assert upload_calls == [
        {
            "content": b"fake-webp",
            "filename": "cover.webp",
            "content_type": "image/webp",
        }
    ]

    with Session(engine) as session:
        project = session.exec(select(ProjectFile).where(ProjectFile.id == project_id)).one()
        assert project.cover_image_url == payload["cover_image_url"]


def _create_project(engine):
    with Session(engine) as session:
        project = ProjectFile(
            owner_id="user_project",
            organization_id="org_project",
            team_id=session.exec(select(Team.id).where(Team.organization_id == "org_project")).one(),
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
        session.flush()
        team = Team(
            organization_id="org_project",
            name="General",
            key="GENERAL",
            created_by="user_project",
        )
        session.add(team)
        session.flush()
        session.add(TeamMembership(team_id=team.id, user_id="user_project", role="admin"))
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
