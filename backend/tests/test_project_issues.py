import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.core import security
from app.db.session import get_session
from app.main import app
from app.models.project_issue import ProjectIssue


@pytest.fixture()
def project_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    token_state = {
        "sub": "user_issue_test",
        "email": "issues@example.com",
        "name": "Issue Tester",
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
        yield TestClient(app), engine, token_state
    finally:
        app.dependency_overrides.clear()


def test_project_issues_are_persistent_and_project_scoped(project_client):
    client, _engine, _token_state = project_client
    first_project = client.post("/api/v1/projects/", json={"name": "First"}).json()
    second_project = client.post("/api/v1/projects/", json={"name": "Second"}).json()

    created = client.post(
        f"/api/v1/projects/{first_project['id']}/issues",
        json={
            "issue": "Bracket tolerance",
            "description": "Confirm the revised dimension.",
            "author": "Maya Owens",
            "status": "blocked",
        },
    )

    assert created.status_code == 201
    assert created.json()["project_file_id"] == first_project["id"]
    assert client.get(f"/api/v1/projects/{second_project['id']}/issues").json() == []
    assert [item["issue"] for item in client.get(
        f"/api/v1/projects/{first_project['id']}/issues"
    ).json()] == ["Bracket tolerance"]


def test_project_issues_are_isolated_by_organization(project_client):
    client, _engine, token_state = project_client
    project = client.post("/api/v1/projects/", json={"name": "Alpha"}).json()
    client.post(
        f"/api/v1/projects/{project['id']}/issues",
        json={
            "issue": "Alpha issue",
            "description": "Visible only in alpha.",
            "author": "Maya Owens",
        },
    )

    token_state["o"] = {"id": "org_beta", "slg": "beta", "rol": "member"}

    response = client.get(f"/api/v1/projects/{project['id']}/issues")
    assert response.status_code == 404


def test_project_issue_can_be_updated_and_deleted(project_client):
    client, _engine, _token_state = project_client
    project = client.post("/api/v1/projects/", json={"name": "Lifecycle"}).json()
    issue = client.post(
        f"/api/v1/projects/{project['id']}/issues",
        json={
            "issue": "Review fasteners",
            "description": "Verify the final hardware list.",
            "author": "Maya Owens",
        },
    ).json()

    updated = client.patch(
        f"/api/v1/projects/{project['id']}/issues/{issue['id']}",
        json={"status": "resolved"},
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "resolved"

    deleted = client.delete(f"/api/v1/projects/{project['id']}/issues/{issue['id']}")
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/projects/{project['id']}/issues").json() == []


def test_deleting_project_removes_attached_issues(project_client):
    client, engine, _token_state = project_client
    project = client.post("/api/v1/projects/", json={"name": "Disposable"}).json()
    client.post(
        f"/api/v1/projects/{project['id']}/issues",
        json={
            "issue": "Temporary issue",
            "description": "This should be deleted with the project.",
            "author": "Maya Owens",
        },
    )

    assert client.delete(f"/api/v1/projects/{project['id']}").status_code == 204
    with Session(engine) as session:
        assert session.exec(select(ProjectIssue)).all() == []
