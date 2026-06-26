import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.core import security
from app.db.session import get_session
from app.main import app


@pytest.fixture()
def search_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    token_state = {
        "sub": "user_search_test",
        "email": "search@example.com",
        "name": "Search Tester",
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


def test_search_returns_matching_projects_and_project_issues(search_client):
    client, _token_state = search_client
    project = client.post(
        "/api/v1/projects/",
        json={
            "name": "Bracket assembly",
            "description": "Hydraulic mounting fixture",
            "status": "in_progress",
        },
    ).json()
    client.post(
        f"/api/v1/projects/{project['id']}/issues",
        json={
            "issue": "Bracket tolerance",
            "description": "Confirm the revised mounting dimension.",
            "author": "Maya Owens",
            "status": "blocked",
        },
    )
    team = client.get("/api/v1/teams/").json()[0]
    client.post(
        f"/api/v1/teams/{team['id']}/issues",
        json={
            "issue": "Bracket supplier follow-up",
            "description": "Ask for the revised delivery estimate.",
            "author": "Nora Patel",
            "status": "in-progress",
        },
    )
    client.post("/api/v1/projects/", json={"name": "Unrelated project"})

    response = client.get("/api/v1/search/", params={"q": "bracket"})

    assert response.status_code == 200
    results = response.json()["results"]
    assert {(result["type"], result["title"]) for result in results} == {
        ("project", "Bracket assembly"),
        ("issue", "Bracket tolerance"),
        ("issue", "Bracket supplier follow-up"),
    }
    issue = next(result for result in results if result["issue_scope"] == "project")
    assert issue["project_id"] == project["id"]
    assert issue["project_name"] == "Bracket assembly"
    assert issue["team_name"] == "General"
    team_issue = next(result for result in results if result["issue_scope"] == "team")
    assert team_issue["project_id"] is None
    assert team_issue["team_id"] == team["id"]

    description_match = client.get(
        "/api/v1/search/",
        params={"q": "hydraulic"},
    ).json()["results"]
    assert [result["title"] for result in description_match] == ["Bracket assembly"]


def test_search_is_scoped_to_the_active_organization_and_team_memberships(search_client):
    client, token_state = search_client
    token_state["pla"] = "o:pro"
    team = client.post(
        "/api/v1/teams/",
        json={"name": "Engineering", "key": "ENG"},
    ).json()
    client.post(
        "/api/v1/projects/",
        json={"name": "Secret engineering fixture", "team_id": team["id"]},
    )

    token_state.update(
        {
            "sub": "user_without_team_access",
            "email": "limited@example.com",
            "name": "Limited User",
        }
    )
    assert client.get(
        "/api/v1/search/",
        params={"q": "secret"},
    ).json()["results"] == []

    token_state.update(
        {
            "sub": "user_search_test",
            "email": "search@example.com",
            "name": "Search Tester",
            "o": {"id": "org_beta", "slg": "beta", "rol": "admin"},
        }
    )
    assert client.get(
        "/api/v1/search/",
        params={"q": "secret"},
    ).json()["results"] == []


def test_search_treats_sql_wildcards_as_literal_text(search_client):
    client, _token_state = search_client
    client.post("/api/v1/projects/", json={"name": "100% complete"})
    client.post("/api/v1/projects/", json={"name": "1000 complete"})

    results = client.get(
        "/api/v1/search/",
        params={"q": "100%"},
    ).json()["results"]

    assert [result["title"] for result in results] == ["100% complete"]


def test_search_rejects_blank_queries_after_trimming(search_client):
    client, _token_state = search_client

    response = client.get("/api/v1/search/", params={"q": "  "})

    assert response.status_code == 422
