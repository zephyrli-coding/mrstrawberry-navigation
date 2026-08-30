import os
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, Request
from jose import JWTError
from sqlalchemy.orm import Session

from database import get_db
from app.auth_client import decode_auth_token
from app.models import User
from app.session import SESSION_COOKIE_NAME, require_csrf, session_store

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:20263")
AUTH_CLIENT_ID = os.getenv("AUTH_CLIENT_ID", "navigation")
AUTH_CLIENT_SECRET = os.getenv("AUTH_CLIENT_SECRET", "")


def _refresh_session(session_id: str, session_data: dict) -> dict:
    if not session_data.get("refresh_token"):
        session_store.delete(session_id)
        raise HTTPException(status_code=401, detail="Session expired")
    try:
        response = httpx.post(
            f"{AUTH_SERVICE_URL}/oauth/token",
            json={
                "grant_type": "refresh_token",
                "refresh_token": session_data["refresh_token"],
                "client_id": AUTH_CLIENT_ID,
                "client_secret": AUTH_CLIENT_SECRET,
            },
            timeout=10.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Authentication service unavailable") from exc
    if response.status_code != 200:
        session_store.delete(session_id)
        raise HTTPException(status_code=401, detail="Session expired")
    tokens = response.json()
    session_data["access_token"] = tokens["access_token"]
    session_data["refresh_token"] = tokens.get("refresh_token", session_data["refresh_token"])
    session_store.save(session_id, session_data)
    return session_data


def load_userinfo(request: Request) -> tuple[str, dict, dict]:
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session_data = session_store.get(session_id)
    if not session_data:
        raise HTTPException(status_code=401, detail="Session expired")

    try:
        payload = decode_auth_token(session_data["access_token"])
    except (JWTError, KeyError):
        session_data = _refresh_session(session_id, session_data)
        try:
            payload = decode_auth_token(session_data["access_token"])
        except (JWTError, KeyError) as exc:
            session_store.delete(session_id)
            raise HTTPException(status_code=401, detail="Invalid authentication token") from exc

    def fetch_userinfo() -> httpx.Response:
        try:
            return httpx.get(
                f"{AUTH_SERVICE_URL}/oauth/userinfo",
                headers={"Authorization": f"Bearer {session_data['access_token']}"},
                timeout=10.0,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=503, detail="Authentication service unavailable") from exc

    userinfo_response = fetch_userinfo()
    if userinfo_response.status_code == 401:
        session_data = _refresh_session(session_id, session_data)
        payload = decode_auth_token(session_data["access_token"])
        userinfo_response = fetch_userinfo()
    if userinfo_response.status_code != 200:
        if userinfo_response.status_code < 500:
            session_store.delete(session_id)
        raise HTTPException(
            status_code=401 if userinfo_response.status_code < 500 else 503,
            detail="Unable to validate session",
        )
    userinfo = userinfo_response.json()
    if str(payload.get("sub")) != str(userinfo.get("sub")):
        session_store.delete(session_id)
        raise HTTPException(status_code=401, detail="Invalid session")
    return session_id, session_data, userinfo


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    _, session_data, userinfo = load_userinfo(request)
    require_csrf(request, session_data)
    user = db.query(User).filter(User.auth_user_id == str(userinfo["sub"])).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not request.cookies.get(SESSION_COOKIE_NAME):
        return None
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None
