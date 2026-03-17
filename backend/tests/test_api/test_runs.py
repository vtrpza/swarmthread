import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine

from app.db import get_session
from app.main import app as fastapi_app

TEST_ENGINE = create_engine(
    "sqlite:///:memory:", connect_args={"check_same_thread": False}
)


@pytest.fixture(name="session", scope="function")
def session_fixture():
    SQLModel.metadata.create_all(TEST_ENGINE)
    connection = TEST_ENGINE.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        yield session

    fastapi_app.dependency_overrides[get_session] = get_session_override
    with TestClient(fastapi_app) as client:
        yield client
    fastapi_app.dependency_overrides.clear()


def test_health_check(client: TestClient):
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_create_run(client: TestClient):
    response = client.post(
        "/runs/",
        json={
            "title": "Test Campaign",
            "brand": "Test Brand",
            "goal": "Test goal",
            "content_type": "thought_leadership",
            "message": "Test message",
            "cta": "Test CTA",
            "tone": "confident",
            "audience_segments": ["test_segment"],
            "controversy_level": "low",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "queued"
    assert data["agent_count"] == 20
    assert data["round_count"] == 150
