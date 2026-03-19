import os
import hashlib
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import RefreshToken

router = APIRouter(tags=["auth"])
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer()

JWT_SECRET         = os.environ["JWT_SECRET"]
JWT_REFRESH_SECRET = os.environ["JWT_REFRESH_SECRET"]
USER_SERVICE_URL   = os.environ["USER_SERVICE_URL"]
ACCESS_TTL_MIN     = 15          # 15-minute access tokens
REFRESH_TTL_DAYS   = 7


# ── Helpers ────────────────────────────────────────────────────────────────

def _issue_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def _issue_refresh_token() -> str:
    return str(uuid.uuid4())          # opaque random token


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def _get_user_by_email(email: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{USER_SERVICE_URL}/internal/users/by-email/{email}")
    if r.status_code == 404:
        raise HTTPException(401, "Invalid credentials")
    r.raise_for_status()
    return r.json()


# ── Schemas ────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── POST /auth/login ───────────────────────────────────────────────────────
@router.post("/auth/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await _get_user_by_email(data.email)

    if not user["is_active"]:
        raise HTTPException(403, "Account is disabled")

    if not pwd.verify(data.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")

    access_token  = _issue_access_token(str(user["id"]), user["role"])
    refresh_token = _issue_refresh_token()

    # Persist hashed refresh token — never store raw token
    db.add(RefreshToken(
        user_id=uuid.UUID(str(user["id"])),
        token_hash=_hash_token(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TTL_DAYS),
    ))
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


# ── POST /auth/refresh ─────────────────────────────────────────────────────
@router.post("/auth/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token_hash = _hash_token(data.refresh_token)
    record = await db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
        )
    )
    if not record:
        raise HTTPException(401, "Invalid or revoked refresh token")

    if record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(401, "Refresh token expired")

    # Rotate: revoke old, issue new refresh token
    record.revoked = True
    new_refresh = _issue_refresh_token()
    db.add(RefreshToken(
        user_id=record.user_id,
        token_hash=_hash_token(new_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TTL_DAYS),
    ))
    await db.commit()

    # We only have user_id here; issue token without role (or call user-service)
    access_token = _issue_access_token(str(record.user_id), "customer")
    return TokenResponse(access_token=access_token, refresh_token=new_refresh)


# ── POST /auth/logout ──────────────────────────────────────────────────────
@router.post("/auth/logout", status_code=204)
async def logout(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token_hash = _hash_token(data.refresh_token)
    record = await db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    if record:
        record.revoked = True
        await db.commit()


# ── GET /auth/verify — Called internally by other services ─────────────────
@router.get("/auth/verify")
async def verify(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return {"user_id": payload["sub"], "role": payload.get("role")}
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")
