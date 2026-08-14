import os
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from app.auth import get_current_user
from app.models import User
from app.schemas import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:20263")
AUTH_CLIENT_ID = os.getenv("AUTH_CLIENT_ID", "navigation")
AUTH_CLIENT_SECRET = os.getenv("AUTH_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/callback")
def auth_callback(code: str, db: Session = Depends(get_db)):
    if not AUTH_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth client secret not configured",
        )

    redirect_uri = f"{FRONTEND_URL}/auth/callback"
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
    if token_res.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange authorization code",
        )

    tokens = token_res.json()
    access_token = tokens["access_token"]

    # 获取用户信息
    userinfo_res = httpx.get(
        f"{AUTH_SERVICE_URL}/oauth/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10.0,
    )
    if userinfo_res.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to fetch user info",
        )

    userinfo = userinfo_res.json()
    auth_user_id = UUID(userinfo["sub"])
    email = userinfo["email"]
    nickname = userinfo.get("nickname")

    user = db.query(User).filter(User.auth_user_id == str(auth_user_id)).first()
    if not user:
        # Claim a pre-SSO user by its unique email so existing bookmarks and
        # categories remain attached after migration.
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.auth_user_id = str(auth_user_id)

    if not user:
        user = User(
            auth_user_id=str(auth_user_id),
            email=email,
            # Compatibility with legacy SQLite schemas where hashed_pw is
            # still NOT NULL. This value can never authenticate locally.
            hashed_pw="!auth-service-only!",
            nickname=nickname,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # 同步邮箱/昵称
        if user.email != email or user.nickname != nickname or not user.auth_user_id:
            user.auth_user_id = str(auth_user_id)
            user.email = email
            user.nickname = nickname
            db.commit()
            db.refresh(user)

    return {
        "access_token": access_token,
        "refresh_token": tokens.get("refresh_token"),
        "token_type": tokens.get("token_type", "bearer"),
        "expires_in": tokens.get("expires_in"),
        "user": UserResponse.model_validate(user),
    }


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
def logout():
    return {"message": "Logged out"}
