# FastAPI Production Template

A production-grade FastAPI project demonstrating real-world architecture patterns used by senior engineers.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web framework | FastAPI 0.115 |
| Validation | Pydantic v2 |
| ORM | SQLAlchemy 2 (async) |
| DB driver | aiosqlite (dev) / asyncpg (prod) |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Testing | pytest + pytest-asyncio + httpx |

---

## Project Structure

```
fastapi-production/
├── app/
│   ├── main.py                 # App factory + lifespan
│   ├── core/
│   │   ├── config.py           # Pydantic BaseSettings
│   │   ├── database.py         # Async engine + session factory
│   │   ├── security.py         # JWT + password hashing
│   │   ├── dependencies.py     # FastAPI Depends()
│   │   └── exceptions.py       # Domain exceptions + handlers
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── user.py
│   │   └── item.py
│   ├── schemas/                # Pydantic request/response schemas
│   │   ├── user.py
│   │   ├── item.py
│   │   ├── token.py
│   │   └── common.py
│   ├── repositories/           # Data access layer (SQL)
│   │   ├── base_repository.py
│   │   ├── user_repository.py
│   │   └── item_repository.py
│   ├── services/               # Business logic layer
│   │   ├── user_service.py
│   │   └── item_service.py
│   ├── api/
│   │   └── v1/
│   │       ├── router.py
│   │       └── endpoints/
│   │           ├── auth.py
│   │           ├── users.py
│   │           └── items.py
│   └── middleware/
│       └── logging.py
├── tests/
│   ├── conftest.py             # Fixtures + test DB
│   ├── test_health.py
│   ├── test_auth.py
│   ├── test_users.py
│   └── test_items.py
├── alembic/                    # DB migrations
├── .env.example
├── requirements.txt
└── pyproject.toml
```

---

## Quick Start

### 1. Install dependencies

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set a strong SECRET_KEY
```

### 3. Run the server

```bash
uvicorn app.main:app --reload
```

### 4. Explore the API

- Swagger UI: http://localhost:8000/docs
- ReDoc:       http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

---

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/login` | None | Login, get tokens |
| POST | `/api/v1/auth/refresh` | None | Refresh access token |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/users/` | None | Register |
| GET | `/api/v1/users/me` | Bearer | Get own profile |
| PATCH | `/api/v1/users/me` | Bearer | Update own profile |
| GET | `/api/v1/users/` | Superuser | List all users |
| GET | `/api/v1/users/{id}` | Bearer | Get user by ID |
| DELETE | `/api/v1/users/{id}` | Bearer | Delete user |

### Items
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/items/` | Bearer | Create item |
| GET | `/api/v1/items/` | None | List all items |
| GET | `/api/v1/items/mine` | Bearer | List my items |
| GET | `/api/v1/items/{id}` | None | Get item |
| PATCH | `/api/v1/items/{id}` | Bearer (owner) | Update item |
| DELETE | `/api/v1/items/{id}` | Bearer (owner) | Delete item |

---

## Running Tests

```bash
pytest                          # all tests with coverage
pytest tests/test_auth.py -v    # single file
pytest -k "test_login" -v       # filter by name
pytest --cov=app --cov-report=html  # HTML coverage report
```

---

## Database Migrations (Alembic)

```bash
# Create a new migration (auto-detects model changes)
alembic revision --autogenerate -m "add users and items tables"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

---

## Architecture Notes

### Layered Architecture

```
HTTP Request
    ↓
Router (FastAPI endpoint)   — validates HTTP, extracts dependencies
    ↓
Service Layer               — business rules, orchestration
    ↓
Repository Layer            — data access, SQL queries
    ↓
Database (SQLAlchemy)
```

- **Routers** never talk to the DB directly.
- **Services** hold all domain logic; they're easy to unit test.
- **Repositories** are the only place SQL lives — swap DB without touching services.

### Pydantic v2 Patterns

- `AppBaseModel` sets `from_attributes=True` globally → ORM → Schema conversion is automatic.
- Input models use `@field_validator` for cross-field checks.
- `model_dump(exclude_none=True)` in services → only set fields are updated (PATCH semantics).

### Security

- Passwords hashed with bcrypt via passlib.
- Short-lived access tokens (30 min) + long-lived refresh tokens (7 days).
- `CurrentUser` dependency — a single `Annotated` alias used across all protected routes.
- Docs/OpenAPI disabled in `production` environment.
