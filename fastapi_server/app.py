"""
FastAPI Interview Demo Server
Covers: Async/Await, Pydantic V2, Dependency Injection, Middleware,
        SQLAlchemy Async, JWT Auth, WebSocket, Background Tasks, Lifespan
Run:  uvicorn app:app --reload --port 8000
Test: pytest tests/ -v
"""

import os
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import (
    FastAPI, Depends, HTTPException, status, Query, Path,
    BackgroundTasks, WebSocket, WebSocketDisconnect, Request
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from pydantic_settings import BaseSettings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Boolean, ForeignKey, Integer, DateTime, select, func
from passlib.context import CryptContext
from jose import jwt as jose_jwt, JWTError
import time
import asyncio


# ══════════════════════════════════════════════
# Configuration (Pydantic Settings)
# ══════════════════════════════════════════════
class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./app.db"
    secret_key: str = "dev-secret-key-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    debug: bool = True

    model_config = ConfigDict(env_file=".env")


settings = Settings()

# ══════════════════════════════════════════════
# Database Setup (Async SQLAlchemy 2.0)
# ══════════════════════════════════════════════
engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class UserModel(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    posts: Mapped[list["PostModel"]] = relationship(back_populates="author")


class PostModel(Base):
    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    published: Mapped[bool] = mapped_column(Boolean, default=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    author: Mapped["UserModel"] = relationship(back_populates="posts")


# ══════════════════════════════════════════════
# Pydantic Schemas (Request/Response Models)
# ══════════════════════════════════════════════

# -- Auth Schemas --
class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)  # Pydantic V2 orm_mode


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# -- Post Schemas --
class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1)
    published: bool = False


class PostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = None
    published: bool | None = None


class PostResponse(BaseModel):
    id: int
    title: str
    body: str
    published: bool
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedPosts(BaseModel):
    posts: list[PostResponse]
    total: int
    page: int
    per_page: int
    pages: int


# ══════════════════════════════════════════════
# Security Utilities
# ══════════════════════════════════════════════
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + expires_delta
    return jose_jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict:
    return jose_jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


# ══════════════════════════════════════════════
# Dependency Injection
# ══════════════════════════════════════════════
async def get_db() -> AsyncSession:
    """Yield a database session per request — auto-closes after."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserModel:
    """Extract user from JWT token in Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_admin_user(
    current_user: UserModel = Depends(get_current_user),
) -> UserModel:
    """Dependency that ensures the user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# Type aliases for cleaner signatures
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[UserModel, Depends(get_current_user)]
AdminUser = Annotated[UserModel, Depends(get_admin_user)]


# ══════════════════════════════════════════════
# WebSocket Connection Manager
# ══════════════════════════════════════════════
class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active_connections.remove(ws)

    async def broadcast(self, message: str):
        for conn in self.active_connections:
            await conn.send_text(message)


ws_manager = ConnectionManager()


# ══════════════════════════════════════════════
# Background Task Example
# ══════════════════════════════════════════════
def send_notification_email(email: str, subject: str):
    """Simulated background email task."""
    import time
    time.sleep(1)  # simulate I/O
    print(f"[BG TASK] Email sent to {email}: {subject}")


# ══════════════════════════════════════════════
# Lifespan (startup/shutdown)
# ══════════════════════════════════════════════
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern lifespan handler — replaces on_event('startup'/'shutdown')."""
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created.")
    yield
    # Shutdown
    await engine.dispose()
    print("Database connection closed.")


# ══════════════════════════════════════════════
# App Initialization
# ══════════════════════════════════════════════
app = FastAPI(
    title="FastAPI Interview Demo",
    version="1.0.0",
    description="Comprehensive FastAPI demo covering all major interview topics",
    lifespan=lifespan,
)

# ── Middleware ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    """Custom middleware — measure response time."""
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start
    response.headers["X-Response-Time"] = f"{duration:.4f}s"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


# ── Custom Exception Handler ──
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


# ══════════════════════════════════════════════
# Routes — Auth
# ══════════════════════════════════════════════
@app.post("/api/auth/register", response_model=UserResponse, status_code=201,
          tags=["auth"])
async def register(data: UserRegister, db: DbSession, background_tasks: BackgroundTasks):
    """Register a new user with background welcome email."""
    # Check existing
    result = await db.execute(
        select(UserModel).where(
            (UserModel.username == data.username) | (UserModel.email == data.email)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username or email already exists")

    user = UserModel(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.flush()  # get user.id before commit
    await db.refresh(user)

    # Background task: send welcome email
    background_tasks.add_task(send_notification_email, data.email, "Welcome!")

    return user


@app.post("/api/auth/login", response_model=TokenResponse, tags=["auth"])
async def login(data: UserLogin, db: DbSession):
    """Login and receive JWT access + refresh tokens."""
    result = await db.execute(
        select(UserModel).where(UserModel.username == data.username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_token(
        {"sub": str(user.id), "role": user.role, "username": user.username},
        timedelta(minutes=settings.access_token_expire_minutes),
    )
    refresh_token = create_token(
        {"sub": str(user.id), "type": "refresh"},
        timedelta(days=settings.refresh_token_expire_days),
    )

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@app.get("/api/auth/me", response_model=UserResponse, tags=["auth"])
async def me(current_user: CurrentUser):
    """Get current user profile (uses dependency injection)."""
    return current_user


# ══════════════════════════════════════════════
# Routes — Posts (CRUD)
# ══════════════════════════════════════════════
@app.get("/api/posts", response_model=PaginatedPosts, tags=["posts"])
async def list_posts(
    db: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 10,
    q: str | None = None,
):
    """List published posts with pagination and search."""
    base_query = select(PostModel).where(PostModel.published == True)
    if q:
        base_query = base_query.where(PostModel.title.ilike(f"%{q}%"))

    # Count total
    count_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = count_result.scalar()

    # Fetch page
    result = await db.execute(
        base_query
        .order_by(PostModel.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    posts = result.scalars().all()

    return PaginatedPosts(
        posts=posts,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page,
    )


@app.get("/api/posts/{post_id}", response_model=PostResponse, tags=["posts"])
async def get_post(post_id: Annotated[int, Path(ge=1)], db: DbSession):
    """Get a single post by ID."""
    result = await db.execute(select(PostModel).where(PostModel.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@app.post("/api/posts", response_model=PostResponse, status_code=201, tags=["posts"])
async def create_post(data: PostCreate, db: DbSession, current_user: CurrentUser):
    """Create a new post (authenticated)."""
    post = PostModel(**data.model_dump(), user_id=current_user.id)
    db.add(post)
    await db.flush()
    await db.refresh(post)

    # Notify WebSocket clients
    await ws_manager.broadcast(f"New post: {post.title}")

    return post


@app.put("/api/posts/{post_id}", response_model=PostResponse, tags=["posts"])
async def update_post(
    post_id: int,
    data: PostUpdate,
    db: DbSession,
    current_user: CurrentUser,
):
    """Update own post."""
    result = await db.execute(select(PostModel).where(PostModel.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(post, key, value)

    await db.flush()
    await db.refresh(post)
    return post


@app.delete("/api/posts/{post_id}", tags=["posts"])
async def delete_post(post_id: int, db: DbSession, current_user: CurrentUser):
    """Delete own post."""
    result = await db.execute(select(PostModel).where(PostModel.id == post_id))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")

    await db.delete(post)
    return {"msg": "Post deleted"}


# ══════════════════════════════════════════════
# Routes — Admin
# ══════════════════════════════════════════════
@app.get("/api/admin/users", response_model=list[UserResponse], tags=["admin"])
async def list_users(db: DbSession, admin: AdminUser):
    """Admin: list all users."""
    result = await db.execute(select(UserModel))
    return result.scalars().all()


@app.delete("/api/admin/users/{user_id}", tags=["admin"])
async def delete_user(user_id: int, db: DbSession, admin: AdminUser):
    """Admin: delete a user."""
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    return {"msg": "User deleted"}


# ══════════════════════════════════════════════
# WebSocket Endpoint
# ══════════════════════════════════════════════
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """Real-time WebSocket — broadcasts new post notifications."""
    await ws_manager.connect(ws)
    try:
        while True:
            data = await ws.receive_text()
            await ws_manager.broadcast(f"Client says: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(ws)


# ══════════════════════════════════════════════
# Health & Root
# ══════════════════════════════════════════════
@app.get("/health", tags=["system"])
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/", tags=["system"])
async def root():
    return {
        "message": "FastAPI Interview Demo API",
        "version": "1.0.0",
        "docs": "/docs (Swagger UI) | /redoc (ReDoc)",
        "endpoints": {
            "auth": "/api/auth  (register, login, me)",
            "posts": "/api/posts (CRUD, paginated)",
            "admin": "/api/admin (user management)",
            "websocket": "/ws (real-time notifications)",
            "health": "/health",
        },
    }
