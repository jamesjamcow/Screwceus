import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.core import security
from app.db.session import get_session
from app.main import app
from app.models.folder import Folder


@pytest.fixture()
def engine():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(test_engine)
    return test_engine


@pytest.fixture()
def client(engine):
    def override_verify_clerk_token():
        return {
            "sub": "user_folders",
            "email": "folders@example.com",
            "name": "Folders User",
        }

    def override_get_session():
        with Session(engine) as test_session:
            yield test_session

    app.dependency_overrides[security.verify_clerk_token] = override_verify_clerk_token
    app.dependency_overrides[get_session] = override_get_session

    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def test_folder_tree_returns_nested_folders_with_cors_header(client, engine):
    with Session(engine) as session:
        root = Folder(owner_id="user_folders", name="Root")
        session.add(root)
        session.commit()
        session.refresh(root)

        child = Folder(owner_id="user_folders", name="Child", parent_id=root.id)
        session.add(child)
        session.commit()
        session.refresh(child)

        expected = [
            {
                "id": root.id,
                "owner_id": "user_folders",
                "name": "Root",
                "parent_id": None,
                "created_at": root.created_at.isoformat(),
                "updated_at": root.updated_at.isoformat(),
                "children": [
                    {
                        "id": child.id,
                        "owner_id": "user_folders",
                        "name": "Child",
                        "parent_id": root.id,
                        "created_at": child.created_at.isoformat(),
                        "updated_at": child.updated_at.isoformat(),
                        "children": [],
                    }
                ],
            }
        ]

        other_user_folder = Folder(owner_id="other_user", name="Hidden")
        session.add(other_user_folder)
        session.commit()

    response = client.get(
        "/api/v1/folders/tree",
        headers={
            "Authorization": "Bearer test-token",
            "Origin": "http://localhost:5173",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response.json() == expected
