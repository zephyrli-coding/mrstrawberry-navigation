import os
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from database import get_db
from app.auth import get_current_user
from app.models import User
from app.schemas import UserResponse
from app.session import (
    SESSION_COOKIE_NAME,
    clear_session_cookies,
    require_csrf,
    session_store,
    set_session_cookies,
)

router = APIRouter(prefix="/auth", tags=["auth"])
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:20263")
AUTH_CLIENT_ID = os.getenv("AUTH_CLIENT_ID", "navigation")
AUTH_CLIENT_SECRET = os.getenv("AUTH_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/callback", response_model=UserResponse)
def auth_callback(code: str, response: Response, db: Session = Depends(get_db)):
    if not AUTH_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="OAuth client secret not configured")
    redirect_uri = f"{FRONTEND_URL}/auth/callback"
    try:
        token_res = httpx.post(
            f"{AUTH_SERVICE_URL}/oauth/token",
            json={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": AUTH_CLIENT_ID,
                "client_secret": AUTH_CLIENT_SECRET,
            },
            timeout=10.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Authentication service unavailable") from exc
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="OAuth exchange failed")
    tokens = token_res.json()
    try:
        userinfo_res = httpx.get(
            f"{AUTH_SERVICE_URL}/oauth/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
            timeout=10.0,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Authentication service unavailable") from exc
    if userinfo_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Unable to load user")

    userinfo = userinfo_res.json()
    auth_user_id = UUID(userinfo["sub"])
    email = userinfo["email"]
    nickname = userinfo.get("nickname")
    user = db.query(User).filter(User.auth_user_id == str(auth_user_id)).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.auth_user_id = str(auth_user_id)
    if not user:
        user = User(
            auth_user_id=str(auth_user_id),
            email=email,
            hashed_pw="!auth-service-only!",
            nickname=nickname,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.email != email or user.nickname != nickname or not user.auth_user_id:
        user.auth_user_id = str(auth_user_id)
        user.email = email
        user.nickname = nickname
        db.commit()
        db.refresh(user)

    session_id, csrf_token = session_store.create(tokens)
    set_session_cookies(response, session_id, csrf_token)
    return user


@router.put("/me", response_model=UserResponse)
def update_profile(
    nickname: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.nickname = nickname.strip() or None
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/logout")
def logout(request: Request, response: Response):
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if session_id:
        session_data = session_store.get(session_id)
        if session_data:
            require_csrf(request, session_data)
        session_store.delete(session_id)
    clear_session_cookies(response)
    return {"message": "Logged out"}
