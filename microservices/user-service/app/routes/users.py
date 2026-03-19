from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserUpdate, UserResponse, UserInternal
from ..dependencies import get_current_user

router = APIRouter(tags=["users"])
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── POST /users — Register new user ────────────────────────────────────────
@router.post("/users", response_model=UserResponse, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == data.email))
    if existing:
        raise HTTPException(409, "Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password=pwd.hash(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ── GET /users/{id} — Get user profile ────────────────────────────────────
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(404, "User not found")
    # Users can only read their own profile; admins can read anyone
    if current_user["sub"] != user_id and current_user.get("role") != "admin":
        raise HTTPException(403, "Forbidden")
    return user


# ── PUT /users/{id} — Update profile ──────────────────────────────────────
@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["sub"] != user_id and current_user.get("role") != "admin":
        raise HTTPException(403, "Forbidden")

    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(404, "User not found")

    if data.name:
        user.name = data.name
    await db.commit()
    await db.refresh(user)
    return user


# ── GET /internal/users/by-email/{email} — Used by auth-service only ───────
# Not exposed via nginx; only reachable inside Docker network
@router.get("/internal/users/by-email/{email}", response_model=UserInternal, include_in_schema=False)
async def get_by_email(email: str, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == email))
    if not user:
        raise HTTPException(404, "User not found")
    return user
