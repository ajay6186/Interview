# FastAPI Interview Questions & Answers (6-7 Years Experience)

---

## 1. Core Concepts

### Q1: What makes FastAPI different from Flask/Django? Why choose FastAPI?

**Answer:**

| Feature | FastAPI | Flask | Django |
|---------|---------|-------|--------|
| Async Support | Native (ASGI) | Limited | Partial |
| Type Hints | Required, powers validation | Optional | Optional |
| Auto Docs | Swagger + ReDoc built-in | None | None |
| Validation | Pydantic built-in | Manual/Marshmallow | Django Forms |
| Performance | ~On par with Node.js/Go | Slower (WSGI) | Slower (WSGI) |
| Data Serialization | Pydantic (automatic) | Manual | DRF Serializers |

**Key advantages:**
1. **Automatic validation** via Pydantic type hints
2. **Auto-generated OpenAPI docs** (Swagger UI + ReDoc)
3. **Native async/await** support (ASGI)
4. **Dependency injection** system
5. **High performance** — one of the fastest Python frameworks
6. **Editor support** — type hints enable excellent autocomplete

---

### Q2: Explain Pydantic models and validation in FastAPI.

**Answer:**

```python
from pydantic import BaseModel, Field, field_validator, model_validator, EmailStr
from typing import Optional
from datetime import datetime

# --- Basic Model ---
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    age: Optional[int] = Field(None, ge=18, le=120)
    role: str = Field(default='user')

    # Field-level validation
    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v.lower()

    # Cross-field validation
    @model_validator(mode='after')
    def check_admin_age(self):
        if self.role == 'admin' and (self.age is None or self.age < 21):
            raise ValueError('Admin must be at least 21')
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "username": "johndoe",
                    "email": "john@example.com",
                    "password": "securepass123",
                    "age": 30,
                }
            ]
        }
    }

# --- Response Models ---
class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}  # Pydantic v2 (was orm_mode)

class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int

# --- Nested Models ---
class Address(BaseModel):
    street: str
    city: str
    country: str = 'US'

class UserWithAddress(BaseModel):
    name: str
    addresses: list[Address] = []

# --- Usage in endpoints ---
from fastapi import FastAPI

app = FastAPI()

@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(user: UserCreate):
    # user is already validated by Pydantic
    db_user = User(**user.model_dump())
    db.add(db_user)
    await db.commit()
    return db_user

# Multiple response models
from typing import Union

@app.get("/items/{item_id}", response_model=Union[FullItem, BasicItem])
async def get_item(item_id: int):
    pass
```

---

### Q3: Explain FastAPI's Dependency Injection system.

**Answer:**

```python
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated

app = FastAPI()

# --- Basic Dependency ---
async def get_db():
    db = SessionLocal()
    try:
        yield db  # yield = cleanup after response
    finally:
        db.close()

@app.get("/users")
async def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# --- Auth Dependency ---
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).get(payload['sub'])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- Chained Dependencies ---
async def get_admin_user(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not an admin")
    return current_user

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    # Only admins can reach here
    pass

# --- Class-based Dependencies ---
class Pagination:
    def __init__(
        self,
        page: int = Query(1, ge=1),
        per_page: int = Query(20, ge=1, le=100)
    ):
        self.skip = (page - 1) * per_page
        self.limit = per_page

@app.get("/products")
async def list_products(
    pagination: Pagination = Depends(),
    db: Session = Depends(get_db)
):
    products = db.query(Product).offset(pagination.skip).limit(pagination.limit).all()
    return products

# --- Global Dependencies ---
app = FastAPI(dependencies=[Depends(verify_api_key)])

# Router-level dependencies
router = APIRouter(
    prefix="/admin",
    dependencies=[Depends(get_admin_user)]
)

# --- Using Annotated (recommended in modern FastAPI) ---
DBSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]

@app.get("/profile")
async def profile(user: CurrentUser, db: DBSession):
    return user
```

---

### Q4: How do you handle async operations in FastAPI?

**Answer:**

```python
import asyncio
import httpx
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

app = FastAPI()

# --- Async vs Sync Endpoints ---
# Async — for I/O-bound operations (DB queries, API calls, file I/O)
@app.get("/async")
async def async_endpoint():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
    return response.json()

# Sync — for CPU-bound operations (FastAPI runs in threadpool automatically)
@app.get("/sync")
def sync_endpoint():
    result = heavy_cpu_computation()
    return {"result": result}

# --- Async Database with SQLAlchemy ---
engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/db")
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        yield session

@app.get("/users")
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.active == True))
    users = result.scalars().all()
    return users

# --- Parallel async calls ---
@app.get("/dashboard")
async def dashboard():
    async with httpx.AsyncClient() as client:
        # Run all API calls in parallel
        user_task = client.get("https://api.example.com/user")
        orders_task = client.get("https://api.example.com/orders")
        notifications_task = client.get("https://api.example.com/notifications")

        user_resp, orders_resp, notif_resp = await asyncio.gather(
            user_task, orders_task, notifications_task
        )

    return {
        "user": user_resp.json(),
        "orders": orders_resp.json(),
        "notifications": notif_resp.json()
    }

# --- Background Tasks ---
from fastapi import BackgroundTasks

async def send_email(email: str, subject: str):
    # Async email sending
    await async_smtp_send(email, subject)

@app.post("/register")
async def register(
    user: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    db_user = User(**user.model_dump())
    db.add(db_user)
    await db.commit()

    # This runs AFTER the response is sent
    background_tasks.add_task(send_email, user.email, "Welcome!")
    return {"message": "User created"}

# --- Startup/Shutdown Events (Lifespan) ---
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.redis = await aioredis.from_url("redis://localhost")
    app.state.http_client = httpx.AsyncClient()
    yield
    # Shutdown
    await app.state.redis.close()
    await app.state.http_client.aclose()

app = FastAPI(lifespan=lifespan)
```

---

### Q5: How do you handle authentication and authorization in FastAPI?

**Answer:**

```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta

app = FastAPI()

# --- Setup ---
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Token Creation ---
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Login Endpoint ---
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Get Current User Dependency ---
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await get_user_by_id(int(user_id))
    if user is None:
        raise credentials_exception
    return user

# --- Role-Based Authorization ---
class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    async def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

allow_admin = RoleChecker(["admin"])
allow_manager = RoleChecker(["admin", "manager"])

@app.get("/admin/users")
async def admin_users(user: User = Depends(allow_admin)):
    return await get_all_users()

@app.get("/reports")
async def reports(user: User = Depends(allow_manager)):
    return await generate_reports()

# --- Permission-based with scopes ---
from fastapi.security import SecurityScopes

async def get_current_user_with_scopes(
    security_scopes: SecurityScopes,
    token: str = Depends(oauth2_scheme)
):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    token_scopes = payload.get("scopes", [])
    for scope in security_scopes.scopes:
        if scope not in token_scopes:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    return await get_user_by_id(payload["sub"])
```

---

### Q6: How do you structure a large FastAPI application?

**Answer:**

```
project/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app creation
│   ├── config.py            # Settings using pydantic-settings
│   ├── database.py          # DB engine and session
│   ├── dependencies.py      # Shared dependencies
│   ├── models/              # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── product.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── product.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py          # API-specific dependencies
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py    # Main v1 router
│   │       ├── users.py
│   │       └── products.py
│   ├── services/            # Business logic
│   │   ├── user_service.py
│   │   └── product_service.py
│   ├── repositories/        # Data access
│   │   ├── user_repo.py
│   │   └── product_repo.py
│   └── core/
│       ├── security.py      # JWT, hashing
│       └── exceptions.py    # Custom exceptions
├── alembic/                 # Migrations
├── tests/
│   ├── conftest.py
│   ├── test_users.py
│   └── test_products.py
├── alembic.ini
├── requirements.txt
└── Dockerfile
```

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "My API"
    DEBUG: bool = False
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = {"env_file": ".env"}

settings = Settings()

# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.v1.router import api_router
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown

app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
)

app.include_router(api_router, prefix="/api/v1")

# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1 import users, products

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])

# app/api/v1/users.py
from fastapi import APIRouter, Depends
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService
from app.api.deps import get_current_user, get_db

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 20
):
    service = UserService(db)
    return await service.get_users(skip=skip, limit=limit)

@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    service = UserService(db)
    return await service.create_user(user_data)
```

---

### Q7: How do you handle errors and middleware in FastAPI?

**Answer:**

```python
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time
import uuid

app = FastAPI()

# --- Custom Exception Classes ---
class AppException(Exception):
    def __init__(self, status_code: int, detail: str, error_code: str = None):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code

class NotFoundException(AppException):
    def __init__(self, resource: str, resource_id: int):
        super().__init__(
            status_code=404,
            detail=f"{resource} with id {resource_id} not found",
            error_code="NOT_FOUND"
        )

# --- Exception Handlers ---
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "error_code": exc.error_code,
            "path": str(request.url),
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the full exception
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

# --- Custom Middleware ---
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start_time = time.time()

        # Add request ID to state
        request.state.request_id = request_id

        response = await call_next(request)

        # Add timing and request ID to response
        duration = time.time() - start_time
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(duration)

        logger.info(
            f"{request.method} {request.url.path} "
            f"status={response.status_code} duration={duration:.3f}s"
        )
        return response

# --- Add Middleware (order matters — last added = first executed) ---
app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontend.example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rate Limiting with slowapi ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/search")
@limiter.limit("10/minute")
async def search(request: Request, q: str):
    return {"results": []}
```

---

### Q8: How do you test FastAPI applications?

**Answer:**

```python
# conftest.py
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.main import app
from app.database import get_db, Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"
engine = create_async_engine(TEST_DATABASE_URL)

@pytest.fixture(scope="session")
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session(setup_db):
    async with AsyncSession(engine) as session:
        async with session.begin():
            yield session
            await session.rollback()

@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest.fixture
async def auth_client(client):
    """Client with authentication token."""
    response = await client.post("/token", data={
        "username": "testuser",
        "password": "testpass"
    })
    token = response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client

# test_users.py
import pytest

@pytest.mark.asyncio
async def test_create_user(client):
    response = await client.post("/api/v1/users", json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "securepass123"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert "password" not in data  # Password should not be in response

@pytest.mark.asyncio
async def test_create_user_duplicate_email(client):
    # Create first user
    await client.post("/api/v1/users", json={
        "username": "user1",
        "email": "same@example.com",
        "password": "pass12345"
    })
    # Try duplicate
    response = await client.post("/api/v1/users", json={
        "username": "user2",
        "email": "same@example.com",
        "password": "pass12345"
    })
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_protected_endpoint_without_auth(client):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_protected_endpoint_with_auth(auth_client):
    response = await auth_client.get("/api/v1/users/me")
    assert response.status_code == 200

# Testing with dependency overrides
@pytest.mark.asyncio
async def test_with_mock_service(client):
    from unittest.mock import AsyncMock
    mock_service = AsyncMock()
    mock_service.get_users.return_value = [{"id": 1, "name": "Mock User"}]

    app.dependency_overrides[get_user_service] = lambda: mock_service
    response = await client.get("/api/v1/users")
    assert response.status_code == 200
    app.dependency_overrides.clear()
```

---

### Q9: Explain WebSockets in FastAPI.

**Answer:**

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, Set

app = FastAPI()

# --- Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room: str):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = set()
        self.active_connections[room].add(websocket)

    def disconnect(self, websocket: WebSocket, room: str):
        self.active_connections[room].discard(websocket)
        if not self.active_connections[room]:
            del self.active_connections[room]

    async def broadcast(self, message: str, room: str):
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str):
    await manager.connect(websocket, room)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Message: {data}", room)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room)
        await manager.broadcast(f"User left the room", room)

# --- WebSocket with authentication ---
@app.websocket("/ws/private")
async def private_ws(websocket: WebSocket, token: str = Query(...)):
    user = verify_token(token)
    if not user:
        await websocket.close(code=4001)
        return
    await websocket.accept()
    # ... handle messages
```

---

### Q10: How do you handle file uploads and streaming in FastAPI?

**Answer:**

```python
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse, FileResponse
import aiofiles

app = FastAPI()

# --- File Upload ---
@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    description: str = Form(default="")
):
    # Validate file
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(400, "Invalid file type")

    if file.size > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(400, "File too large")

    # Save file
    file_path = f"uploads/{file.filename}"
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)

    return {"filename": file.filename, "size": len(content)}

# --- Multiple Files ---
@app.post("/upload-multiple")
async def upload_multiple(files: list[UploadFile] = File(...)):
    results = []
    for file in files:
        content = await file.read()
        results.append({"name": file.filename, "size": len(content)})
    return results

# --- Streaming Response ---
@app.get("/stream-data")
async def stream_data():
    async def generate():
        for i in range(100):
            yield f"data: {i}\n\n"
            await asyncio.sleep(0.1)

    return StreamingResponse(generate(), media_type="text/event-stream")

# --- Large File Download ---
@app.get("/download/{filename}")
async def download(filename: str):
    file_path = f"files/{filename}"
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )
```

---

### Q11: How do you deploy FastAPI in production?

**Answer:**

```python
# --- Uvicorn (ASGI server) ---
# Development
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production with Gunicorn + Uvicorn workers
# gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# --- Docker ---
"""
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

CMD ["gunicorn", "app.main:app", \
     "-w", "4", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "-b", "0.0.0.0:8000", \
     "--timeout", "120"]
"""

# --- docker-compose.yml ---
"""
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
"""

# --- Health Check endpoint ---
@app.get("/health")
async def health():
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected"}
        )
```
