import os
from datetime import datetime, timezone
from unittest.mock import patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 设置测试环境变量
os.environ["AUTH_SERVICE_URL"] = "http://mock-auth"
os.environ["AUTH_SERVICE_JWKS_URL"] = "http://mock-auth/.well-known/jwks.json"
os.environ["AUTH_CLIENT_ID"] = "navigation"
os.environ["AUTH_CLIENT_SECRET"] = "test-secret"
os.environ["FRONTEND_URL"] = "http://localhost:20261"

from database import Base, get_db  # noqa: E402
from main import app  # noqa: E402

SQLITE_DATABASE_URL = "sqlite:///./test_navigation.db"

engine = create_engine(
    SQLITE_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(SQLITE_DATABASE_URL.replace("sqlite:///", "")):
        os.remove(SQLITE_DATABASE_URL.replace("sqlite:///", ""))


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_auth_me_without_token(client):
    response = client.get("/auth/me")
    assert response.status_code == 403


def test_auth_callback_creates_user(client):
    auth_user_id = str(uuid4())
    email = "navtest@example.com"
    access_token = "mock-access-token"
    refresh_token = "mock-refresh-token"

    with patch("httpx.post") as mock_post, patch("httpx.get") as mock_get:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 1800,
        }

        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "sub": auth_user_id,
            "email": email,
            "nickname": "Nav Tester",
            "email_verified": True,
            "roles": [],
        }

        response = client.post("/auth/callback", params={"code": "mock-code"})

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"] == access_token
    assert data["user"]["email"] == email

    # 验证数据库中创建了用户
    db = TestingSessionLocal()
    from app.models import User

    user = db.query(User).filter(User.auth_user_id == auth_user_id).first()
    assert user is not None
    assert user.email == email
    assert user.nickname == "Nav Tester"
    db.close()
