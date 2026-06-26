from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.api.v1.project_files import router as projects_router
from app.core import security
from app.core.security import OrganizationContext
from app.db import base  # noqa: F401
from app.db.session import get_session
from app.models.organization import Organization
from app.models.part import Part
from app.models.project_file import ProjectFile
from app.models.team import Team, TeamMembership
from app.models.user import User


def test_project_parts_return_linked_part_records():
    client, engine = _client()
    project_id, part_id = _seed_project_and_part(engine)

    create_response = client.post(
        f"/api/v1/projects/{project_id}/parts",
        json={"part_id": part_id, "notes": "Used on the left rail."},
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["part_id"] == part_id
    assert created["notes"] == "Used on the left rail."
    assert created["part"]["name"] == "M4 Drive Screw"
    assert created["part"]["dimensions"] == {"thread": "M4", "length": "40mm"}

    list_response = client.get(f"/api/v1/projects/{project_id}/parts")

    assert list_response.status_code == 200
    payload = list_response.json()
    assert len(payload) == 1
    assert payload[0]["id"] == created["id"]
    assert payload[0]["part"]["type"] == "fastener"

    update_response = client.patch(
        f"/api/v1/projects/{project_id}/parts/{created['id']}",
        json={"point": [0.25, 0.5, 0.75]},
    )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["point"] == [0.25, 0.5, 0.75]
    assert updated["part"]["id"] == part_id


def _seed_project_and_part(engine):
    with Session(engine) as session:
        team = Team(
            organization_id="org_parts",
            name="General",
            key="GENERAL",
            created_by="user_parts",
        )
        session.add(team)
        session.flush()
        session.add(TeamMembership(team_id=team.id, user_id="user_parts", role="admin"))

        project = ProjectFile(
            owner_id="user_parts",
            organization_id="org_parts",
            team_id=team.id,
            name="Camera Slider",
        )
        part = Part(
            owner_id="user_parts",
            organization_id="org_parts",
            name="M4 Drive Screw",
            type="fastener",
            dimensions={"thread": "M4", "length": "40mm"},
            notes="Primary chassis fastener.",
        )
        session.add(project)
        session.add(part)
        session.commit()
        session.refresh(project)
        session.refresh(part)
        return project.id, part.id


def _client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        session.add(Organization(clerk_id="org_parts", name="Parts Org"))
        session.add(User(clerk_id="user_parts", email="parts@example.com"))
        session.commit()

    app = FastAPI()
    app.include_router(projects_router, prefix="/api/v1/projects")

    def override_get_session():
        with Session(engine) as test_session:
            yield test_session

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[security.get_organization_context] = lambda: OrganizationContext(
        user_id="user_parts",
        organization_id="org_parts",
        organization_slug="parts-org",
        organization_role="admin",
    )

    return TestClient(app), engine
