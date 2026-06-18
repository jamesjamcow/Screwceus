from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

import app.api.v1.project_files as project_files_api
from app.api.v1.project_files import router as projects_router
from app.core import security
from app.core.config import settings
from app.db import base  # noqa: F401
from app.db.session import get_session
from app.models.custom_part_type import CustomPartType
from app.models.part import Part
from app.models.project_file import ProjectFile
from app.models.project_part import ProjectPart
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


def test_upload_project_model_uses_local_storage_in_development(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "app_env", "development")
    monkeypatch.setattr(settings, "uploadthing_token", "")
    monkeypatch.setattr(settings, "uploadthing_api_key", "")
    monkeypatch.setattr(settings, "local_upload_dir", str(tmp_path))

    client, engine = _client(monkeypatch)
    project_id = _create_project(engine)

    response = client.post(
        f"/api/v1/projects/{project_id}/model",
        files={"file": ("assembly.glb", b"fake-glb", "model/gltf-binary")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["model_url"].startswith("/uploads/")
    assert payload["model_filename"] == "assembly.glb"
    assert payload["model_file_key"].endswith("-assembly.glb")
    assert (tmp_path / payload["model_file_key"]).read_bytes() == b"fake-glb"


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


def test_project_parts_include_quantity_and_part_payload(monkeypatch):
    client, engine = _client(monkeypatch)
    project_id = _create_project(engine)

    with Session(engine) as session:
        part = Part(
            owner_id="user_project",
            name="Drive Screw",
            type="fastener",
            dimensions={"thread": "M4", "length": "40mm"},
            notes="Primary chassis fastener.",
        )
        session.add(part)
        session.commit()
        session.refresh(part)

        link = ProjectPart(
            owner_id="user_project",
            project_file_id=project_id,
            part_id=part.id,
            quantity_needed=6,
            point=[0.1, 0.2, 0.3],
            notes="Install first.",
            source_image_url="https://example.com/panel.webp",
            annotation_json={"version": 1, "lines": [{"tool": "draw", "points": [0.1, 0.2]}]},
        )
        session.add(link)
        session.commit()

    response = client.get(f"/api/v1/projects/{project_id}/parts")

    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["quantity_needed"] == 6
    assert payload[0]["point"] == [0.1, 0.2, 0.3]
    assert payload[0]["source_image_url"] == "https://example.com/panel.webp"
    assert payload[0]["annotation_json"] == {"version": 1, "lines": [{"tool": "draw", "points": [0.1, 0.2]}]}
    assert payload[0]["part"]["name"] == "Drive Screw"
    assert payload[0]["part"]["dimensions"] == {"thread": "M4", "length": "40mm"}


def test_create_project_part_entry_creates_custom_type_part_and_link(monkeypatch):
    client, engine = _client(monkeypatch)
    project_id = _create_project(engine)

    response = client.post(
        f"/api/v1/projects/{project_id}/part-entry",
        json={
            "name": "Retaining Clip",
            "type": "spring clip",
            "dimensions": {"width": "12mm"},
            "notes": "Use on the left rail.",
            "quantity_needed": 4,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["quantity_needed"] == 4
    assert payload["part"]["name"] == "Retaining Clip"
    assert payload["part"]["type"] == "spring-clip"

    with Session(engine) as session:
        custom_type = session.exec(
            select(CustomPartType).where(
                CustomPartType.owner_id == "user_project",
                CustomPartType.value == "spring-clip",
            )
        ).one()
        assert custom_type.label == "Spring Clip"
        assert session.exec(select(Part)).one().type == "spring-clip"
        assert session.exec(select(ProjectPart)).one().quantity_needed == 4


def test_create_project_part_entry_reuses_existing_part_and_adds_quantity(monkeypatch):
    client, engine = _client(monkeypatch)
    project_id = _create_project(engine)

    with Session(engine) as session:
        part = Part(
            owner_id="user_project",
            name="Drive Screw",
            type="fastener",
            dimensions={"thread": "M4"},
            notes="",
        )
        session.add(part)
        session.commit()
        session.refresh(part)

        link = ProjectPart(
            owner_id="user_project",
            project_file_id=project_id,
            part_id=part.id,
            quantity_needed=2,
        )
        session.add(link)
        session.commit()

    response = client.post(
        f"/api/v1/projects/{project_id}/part-entry",
        json={
            "name": "Drive Screw",
            "type": "fastener",
            "dimensions": {"thread": "M4", "length": "40mm"},
            "notes": "",
            "quantity_needed": 3,
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["quantity_needed"] == 5

    with Session(engine) as session:
        assert len(session.exec(select(Part)).all()) == 1
        assert len(session.exec(select(ProjectPart)).all()) == 1
        assert session.exec(select(ProjectPart)).one().quantity_needed == 5


def _create_project(engine):
    with Session(engine) as session:
        project = ProjectFile(owner_id="user_project", name="Merlin Panel", description="")
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
        app.dependency_overrides[security.get_current_user_id] = lambda: "user_project"

    return TestClient(app), engine
