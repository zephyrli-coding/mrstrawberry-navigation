"""Server-side BFF sessions backed by Redis."""
import hashlib
import json
import os
import secrets
from urllib.parse import urlsplit

from fastapi import HTTPException, Request, Response, status
from redis import Redis
from redis.exceptions import RedisError

REDIS_URL = os.getenv("REDIS_URL", "redis://session-redis:6379/0")
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "604800"))
SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "navigation_session")
CSRF_COOKIE_NAME = os.getenv("CSRF_COOKIE_NAME", "navigation_csrf")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:20261")
_secure_setting = os.getenv("SESSION_COOKIE_SECURE")
COOKIE_SECURE = (
    _secure_setting.lower() in {"1", "true", "yes"}
    if _secure_setting
    else urlsplit(FRONTEND_URL).scheme == "https"
)
COOKIE_PATH = os.getenv("SESSION_COOKIE_PATH", "/") or "/"
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


class SessionStore:
    def __init__(self, redis_url: str = REDIS_URL, prefix: str = "navigation:bff:"):
        self.redis_url = redis_url
        self.prefix = prefix
        self._redis: Redis | None = None

    @property
    def redis(self) -> Redis:
        if self._redis is None:
            self._redis = Redis.from_url(self.redis_url, decode_responses=True)
        return self._redis

    def _key(self, session_id: str) -> str:
        digest = hashlib.sha256(session_id.encode("utf-8")).hexdigest()
        return f"{self.prefix}{digest}"

    def create(self, tokens: dict) -> tuple[str, str]:
        session_id = secrets.token_urlsafe(32)
        csrf_token = secrets.token_urlsafe(32)
        self.save(
            session_id,
            {
                "access_token": tokens["access_token"],
                "refresh_token": tokens.get("refresh_token", ""),
                "csrf_token": csrf_token,
            },
        )
        return session_id, csrf_token

    def get(self, session_id: str) -> dict | None:
        try:
            raw = self.redis.get(self._key(session_id))
        except RedisError as exc:
            raise HTTPException(status_code=503, detail="Session service unavailable") from exc
        return json.loads(raw) if raw else None

    def save(self, session_id: str, data: dict) -> None:
        try:
            self.redis.setex(self._key(session_id), SESSION_TTL_SECONDS, json.dumps(data))
        except RedisError as exc:
            raise HTTPException(status_code=503, detail="Session service unavailable") from exc

    def delete(self, session_id: str) -> None:
        try:
            self.redis.delete(self._key(session_id))
        except RedisError as exc:
            raise HTTPException(status_code=503, detail="Session service unavailable") from exc


session_store = SessionStore()


def set_session_cookies(response: Response, session_id: str, csrf_token: str) -> None:
    common = {
        "max_age": SESSION_TTL_SECONDS,
        "secure": COOKIE_SECURE,
        "samesite": "lax",
        "path": COOKIE_PATH,
    }
    response.set_cookie(SESSION_COOKIE_NAME, session_id, httponly=True, **common)
    response.set_cookie(CSRF_COOKIE_NAME, csrf_token, httponly=False, **common)


def clear_session_cookies(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE_NAME, path=COOKIE_PATH)
    response.delete_cookie(CSRF_COOKIE_NAME, path=COOKIE_PATH)


def require_csrf(request: Request, session_data: dict) -> None:
    if request.method in SAFE_METHODS:
        return
    expected = session_data.get("csrf_token", "")
    supplied = request.headers.get("X-CSRF-Token", "")
    if expected and supplied and secrets.compare_digest(expected, supplied):
        return
    frontend = urlsplit(FRONTEND_URL)
    if request.headers.get("Origin") == f"{frontend.scheme}://{frontend.netloc}":
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid CSRF token")
