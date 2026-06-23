import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.core import security
from app.db.session import get_session
from app.main import app


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
