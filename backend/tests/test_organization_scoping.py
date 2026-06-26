import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.core import security
from app.api.v1 import teams as teams_api
from app.db.session import get_session
from app.main import app
from app.services.clerk_organizations import ClerkOrganizationMember


@pytest.fixture()
def organization_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    token_state = {
        "sub": "user_org_test",
        "email": "org-test@example.com",
        "name": "Organization Tester",
        "o": {"id": "org_alpha", "slg": "alpha", "rol": "admin"},
    }

    def override_verify_clerk_token():
        return token_state

    def override_get_session():
        with Session(engine) as test_session:
            yield test_session

    app.dependency_overrides[security.verify_clerk_token] = override_verify_clerk_token
    app.dependency_overrides[get_session] = override_get_session

    try:
        yield TestClient(app), token_state
    finally:
        app.dependency_overrides.clear()


def test_switching_active_organization_isolates_projects(organization_client):
    client, token_state = organization_client

    created = client.post("/api/v1/projects/", json={"name": "Alpha Project"})
    assert created.status_code == 201
    assert created.json()["organization_id"] == "org_alpha"

    token_state["o"] = {"id": "org_beta", "slg": "beta", "rol": "member"}
    assert client.get("/api/v1/projects/").json() == []

    token_state["o"] = {"id": "org_alpha", "slg": "alpha", "rol": "admin"}
    projects = client.get("/api/v1/projects/").json()
    assert [project["name"] for project in projects] == ["Alpha Project"]


def test_team_list_bootstraps_one_general_team_per_organization(organization_client):
    client, token_state = organization_client

    alpha_teams = client.get("/api/v1/teams/")
    assert alpha_teams.status_code == 200
    assert [(team["name"], team["role"]) for team in alpha_teams.json()] == [("General", "admin")]

    token_state["o"] = {"id": "org_beta", "slg": "beta", "rol": "member"}
    beta_teams = client.get("/api/v1/teams/")
    assert beta_teams.status_code == 200
    assert beta_teams.json()[0]["organization_id"] == "org_beta"


def test_workspace_routes_require_an_active_organization(organization_client):
    client, token_state = organization_client
    token_state.pop("o")

    response = client.get("/api/v1/projects/")

    assert response.status_code == 403
    assert response.json()["detail"] == "Select an organization to access workspace data"


def test_free_organization_cannot_create_additional_team(organization_client):
    client, token_state = organization_client
    token_state["pla"] = "o:free"

    response = client.post(
        "/api/v1/teams/",
        json={"name": "Engineering", "key": "ENG"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "A paid organization plan is required to create additional teams"


def test_paid_organization_can_create_team_with_organization_members(
    organization_client,
    monkeypatch,
):
    client, token_state = organization_client
    token_state["pla"] = "o:pro"

    monkeypatch.setattr(
        teams_api,
        "get_organization_members",
        lambda organization_id, user_ids: {
            "user_org_member": ClerkOrganizationMember(
                user_id="user_org_member",
                email="member@example.com",
                display_name="Organization Member",
                avatar_url="",
            )
        },
    )

    response = client.post(
        "/api/v1/teams/",
        json={
            "name": "Engineering",
            "key": "ENG",
            "member_ids": ["user_org_member"],
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Engineering"

    token_state.update(
        {
            "sub": "user_org_member",
            "email": "member@example.com",
            "name": "Organization Member",
        }
    )
    teams = client.get("/api/v1/teams/").json()
    assert [(team["name"], team["role"]) for team in teams] == [("Engineering", "member")]


def test_team_rejects_user_outside_active_organization(organization_client, monkeypatch):
    client, token_state = organization_client
    token_state["pla"] = "o:pro"
    monkeypatch.setattr(teams_api, "get_organization_members", lambda organization_id, user_ids: {})

    response = client.post(
        "/api/v1/teams/",
        json={"name": "Engineering", "key": "ENG", "member_ids": ["user_external"]},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Every selected team member must belong to the active Clerk organization"


def test_each_team_has_isolated_projects_and_folders(organization_client, monkeypatch):
    client, token_state = organization_client
    general_team = client.get("/api/v1/teams/").json()[0]

    token_state["pla"] = "o:pro"
    monkeypatch.setattr(teams_api, "get_organization_members", lambda organization_id, user_ids: {})
    engineering_team = client.post(
        "/api/v1/teams/",
        json={"name": "Engineering", "key": "ENG"},
    ).json()

    general_folder = client.post(
        "/api/v1/folders/",
        json={"name": "General files", "team_id": general_team["id"]},
    ).json()
    client.post(
        "/api/v1/projects/",
        json={"name": "General project", "team_id": general_team["id"]},
    )
    client.post(
        "/api/v1/photos/",
        json={
            "title": "General photo",
            "image_url": "https://example.com/general.png",
            "team_id": general_team["id"],
        },
    )

    assert client.get(
        "/api/v1/projects/",
        params={"team_id": engineering_team["id"]},
    ).json() == []
    assert client.get(
        "/api/v1/folders/tree",
        params={"team_id": engineering_team["id"]},
    ).json() == []
    assert client.get(
        "/api/v1/photos/",
        params={"team_id": engineering_team["id"]},
    ).json() == []

    engineering_project = client.post(
        "/api/v1/projects/",
        json={"name": "Engineering project", "team_id": engineering_team["id"]},
    )
    assert engineering_project.status_code == 201

    general_projects = client.get(
        "/api/v1/projects/",
        params={"team_id": general_team["id"]},
    ).json()
    engineering_projects = client.get(
        "/api/v1/projects/",
        params={"team_id": engineering_team["id"]},
    ).json()
    assert [project["name"] for project in general_projects] == ["General project"]
    assert [project["name"] for project in engineering_projects] == ["Engineering project"]

    cross_team_project = client.post(
        "/api/v1/projects/",
        json={
            "name": "Invalid project",
            "team_id": engineering_team["id"],
            "folder_id": general_folder["id"],
        },
    )
    assert cross_team_project.status_code == 404
    assert cross_team_project.json()["detail"] == "Folder not found"
