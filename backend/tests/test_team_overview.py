import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.api.v1 import teams as teams_api
from app.core import security
from app.db.session import get_session
from app.main import app
from app.models.folder import Folder
from app.models.photo import Photo
from app.models.project_file import ProjectFile
from app.models.project_issue import ProjectIssue
from app.models.project_screenshot import ProjectScreenshot
from app.models.team import Team, TeamIssue, TeamMembership, TeamResource


class TeamClientContext:
    def __init__(self, client, token_state, engine):
        self.client = client
        self.token_state = token_state
        self.engine = engine

    def __iter__(self):
        yield self.client
        yield self.token_state


@pytest.fixture()
def team_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record):
        dbapi_connection.execute("PRAGMA foreign_keys=ON")

    SQLModel.metadata.create_all(engine)
    token_state = {
        "sub": "user_team_overview",
        "email": "team-overview@example.com",
        "name": "Team Overview User",
        "o": {"id": "org_team_overview", "slg": "team-overview", "rol": "admin"},
    }

    def override_verify_clerk_token():
        return token_state

    def override_get_session():
        with Session(engine) as test_session:
            yield test_session

    app.dependency_overrides[security.verify_clerk_token] = override_verify_clerk_token
    app.dependency_overrides[get_session] = override_get_session

    try:
        yield TeamClientContext(TestClient(app), token_state, engine)
    finally:
        app.dependency_overrides.clear()


def test_team_description_and_resources_persist_on_overview(team_client):
    client, _ = team_client
    team = client.get("/api/v1/teams/").json()[0]

    update_response = client.patch(
        f"/api/v1/teams/{team['id']}",
        json={"description": "The shared workspace for mechanical design."},
    )
    assert update_response.status_code == 200
    assert update_response.json()["description"] == "The shared workspace for mechanical design."

    create_response = client.post(
        f"/api/v1/teams/{team['id']}/resources",
        json={
            "name": "Design handbook",
            "description": "Standards and review checklists",
            "url": "https://example.com/handbook",
        },
    )
    assert create_response.status_code == 201

    teams = client.get("/api/v1/teams/").json()
    resources = client.get(f"/api/v1/teams/{team['id']}/resources").json()
    assert teams[0]["description"] == "The shared workspace for mechanical design."
    assert [(resource["name"], resource["url"]) for resource in resources] == [
        ("Design handbook", "https://example.com/handbook")
    ]


def test_team_resources_are_scoped_to_team_membership(team_client):
    client, token_state = team_client
    team = client.get("/api/v1/teams/").json()[0]

    token_state["o"] = {"id": "org_other", "slg": "other", "rol": "admin"}

    assert client.patch(
        f"/api/v1/teams/{team['id']}",
        json={"description": "Hidden update"},
    ).status_code == 404
    assert client.get(f"/api/v1/teams/{team['id']}/resources").status_code == 404


def test_team_resource_rejects_non_web_links(team_client):
    client, _ = team_client
    team = client.get("/api/v1/teams/").json()[0]

    response = client.post(
        f"/api/v1/teams/{team['id']}/resources",
        json={
            "name": "Unsafe resource",
            "description": "Should not be accepted",
            "url": "javascript:alert(1)",
        },
    )

    assert response.status_code == 422


def test_team_issues_are_persistent_editable_and_team_scoped(team_client):
    client, token_state = team_client
    team = client.get("/api/v1/teams/").json()[0]

    assert client.get(f"/api/v1/teams/{team['id']}/issues").json() == []

    created_response = client.post(
        f"/api/v1/teams/{team['id']}/issues",
        json={
            "issue": "Review assembly exception",
            "description": "Confirm the owner and next action.",
            "author": "Maya Owens",
            "status": "blocked",
        },
    )
    assert created_response.status_code == 201
    created = created_response.json()
    assert created["team_id"] == team["id"]

    listed = client.get(f"/api/v1/teams/{team['id']}/issues").json()
    assert [issue["issue"] for issue in listed] == ["Review assembly exception"]

    updated = client.patch(
        f"/api/v1/teams/{team['id']}/issues/{created['id']}",
        json={"status": "resolved"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "resolved"

    token_state["o"] = {"id": "org_other", "slg": "other", "rol": "admin"}
    assert client.get(f"/api/v1/teams/{team['id']}/issues").status_code == 404

    token_state["o"] = {
        "id": "org_team_overview",
        "slg": "team-overview",
        "rol": "admin",
    }
    deleted = client.delete(f"/api/v1/teams/{team['id']}/issues/{created['id']}")
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/teams/{team['id']}/issues").json() == []


def test_general_team_cannot_be_deleted(team_client):
    client, _ = team_client
    team = client.get("/api/v1/teams/").json()[0]

    response = client.delete(f"/api/v1/teams/{team['id']}")

    assert response.status_code == 400
    assert response.json()["detail"] == "The default General team cannot be deleted"


def test_team_delete_removes_team_space_data(team_client, monkeypatch):
    client, token_state = team_client
    assert client.get("/api/v1/teams/").json()[0]["key"] == "GENERAL"

    token_state["pla"] = "o:pro"
    monkeypatch.setattr(teams_api, "get_organization_members", lambda organization_id, user_ids: {})

    team = client.post("/api/v1/teams/", json={"name": "Delete Me", "key": "DEL"}).json()
    folder = client.post(
        "/api/v1/folders/",
        json={"name": "Team folder", "team_id": team["id"]},
    ).json()
    project = client.post(
        "/api/v1/projects/",
        json={"name": "Team project", "team_id": team["id"], "folder_id": folder["id"]},
    ).json()
    photo = client.post(
        "/api/v1/photos/",
        json={
            "title": "Team photo",
            "image_url": "https://example.com/team-photo.png",
            "team_id": team["id"],
        },
    ).json()
    client.post(
        f"/api/v1/teams/{team['id']}/resources",
        json={
            "name": "Team docs",
            "description": "Delete with team",
            "url": "https://example.com/docs",
        },
    )
    client.post(
        f"/api/v1/teams/{team['id']}/issues",
        json={
            "issue": "Team issue",
            "description": "Delete with team",
            "author": "Unit Test",
        },
    )

    with Session(team_client.engine) as session:
        session.add(
            ProjectIssue(
                project_file_id=project["id"],
                owner_id=token_state["sub"],
                organization_id=token_state["o"]["id"],
                issue="Project issue",
                author="Unit Test",
            )
        )
        session.add(
            ProjectScreenshot(
                project_file_id=project["id"],
                photo_id=photo["id"],
                owner_id=token_state["sub"],
                organization_id=token_state["o"]["id"],
            )
        )
        session.commit()

    response = client.delete(f"/api/v1/teams/{team['id']}")

    assert response.status_code == 204
    assert [row["key"] for row in client.get("/api/v1/teams/").json()] == ["GENERAL"]
    with Session(team_client.engine) as session:
        assert session.get(Team, team["id"]) is None
        assert session.exec(select(TeamMembership).where(TeamMembership.team_id == team["id"])).all() == []
        assert session.exec(select(TeamResource).where(TeamResource.team_id == team["id"])).all() == []
        assert session.exec(select(TeamIssue).where(TeamIssue.team_id == team["id"])).all() == []
        assert session.exec(select(Folder).where(Folder.team_id == team["id"])).all() == []
        assert session.exec(select(ProjectFile).where(ProjectFile.team_id == team["id"])).all() == []
        assert session.exec(select(Photo).where(Photo.team_id == team["id"])).all() == []
        assert session.exec(select(ProjectIssue).where(ProjectIssue.project_file_id == project["id"])).all() == []
        assert session.exec(
            select(ProjectScreenshot).where(ProjectScreenshot.project_file_id == project["id"])
        ).all() == []
