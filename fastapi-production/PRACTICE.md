# FastAPI Practice Guide

Work through these exercises **in order** — each one builds real muscle memory
for production FastAPI development. Every exercise tells you exactly which files
to touch and what the expected HTTP behaviour should be.

Run tests after every exercise:
```bash
pytest tests/ -v          # full suite (must stay green)
pytest practice/ -v       # exercise-specific tests
```

---

## How the exercises are organised

```
Phase 1 ── Warm-up        (fields, endpoints, filters)
Phase 2 ── Features       (new models, relationships, soft-delete)
Phase 3 ── Auth & Security(passwords, token blocklist, permissions)
Phase 4 ── Advanced       (background tasks, file upload, caching)
Phase 5 ── Testing        (parametrize, factories, coverage)
```

Each exercise has:
- **Goal** — what you are building
- **Files to touch** — exactly where to work
- **Acceptance criteria** — how to know you're done
- **Hints** — read only when stuck
- **Bonus** — harder extension

---

## Phase 1 — Warm-up

### Exercise 1 — Add a `bio` field to User

**Goal:** Users should be able to store an optional biography (max 500 chars).

**Files to touch:**
- `app/models/user.py`
- `app/schemas/user.py`
- Run: `alembic revision --autogenerate -m "add user bio"` then `alembic upgrade head`

**Acceptance criteria:**
```
POST /api/v1/users/       body includes "bio": "I love Python"  → 201, bio returned
PATCH /api/v1/users/me    body {"bio": "Updated bio"}           → 200, bio updated
GET  /api/v1/users/me     response contains "bio" field         → 200
```

**Hints:**
<details>
<summary>Hint 1 — model</summary>

```python
# app/models/user.py
bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
```
</details>

<details>
<summary>Hint 2 — schemas</summary>

Add `bio: str | None = Field(default=None, max_length=500)` to
`UserCreate`, `UserUpdate`, and `UserResponse`.
</details>

**Bonus:** Reject bios containing URLs (add a `@field_validator`).

---

### Exercise 2 — Published items endpoint

**Goal:** Add `GET /api/v1/items/published` — returns only published items, no auth needed.

**Files to touch:**
- `app/repositories/item_repository.py` — `get_published` already exists
- `app/services/item_service.py`
- `app/api/v1/endpoints/items.py`
- `practice/exercises/ex02_test.py` — write a test

**Acceptance criteria:**
```
GET /api/v1/items/published              → 200, only is_published=true items
GET /api/v1/items/published?page_size=2  → 200, pagination works
```

**Hints:**
<details>
<summary>Hint 1 — service method</summary>

```python
async def list_published_items(
    self, *, skip: int = 0, limit: int = 20
) -> tuple[list[Item], int]:
    items = await self._repo.get_published(skip=skip, limit=limit)
    # you need a count_published in the repo too
    total = ...
    return items, total
```
</details>

**Bonus:** Add a query param `?owner_id=3` to filter published items by author.

---

### Exercise 3 — Search items by title

**Goal:** Add `?q=python` query param to `GET /api/v1/items/` for case-insensitive title search.

**Files to touch:**
- `app/repositories/item_repository.py` — new `search` method
- `app/services/item_service.py`
- `app/api/v1/endpoints/items.py`

**Acceptance criteria:**
```
GET /api/v1/items/?q=python   → only items whose title contains "python" (case-insensitive)
GET /api/v1/items/?q=         → treated as no filter (return all)
GET /api/v1/items/?q=zzzzzzz  → 200 with empty items list, total=0
```

**Hints:**
<details>
<summary>Hint 1 — SQLAlchemy ilike</summary>

```python
from sqlalchemy import select
query = select(Item)
if q:
    query = query.where(Item.title.ilike(f"%{q}%"))
```
</details>

**Bonus:** Search across both `title` and `description` using SQLAlchemy `or_()`.

---

## Phase 2 — Features

### Exercise 4 — Tag model + many-to-many with Items

**Goal:** Items can have multiple tags (e.g. "python", "tutorial"). Tags are reusable across items.

**Files to create / touch:**
- `app/models/tag.py` — new `Tag` model + association table
- `app/models/item.py` — add `tags` relationship
- `app/models/__init__.py` — export Tag
- `app/schemas/tag.py` — `TagCreate`, `TagResponse`
- `app/schemas/item.py` — embed `tags: list[TagResponse]` in `ItemResponse`
- `app/repositories/tag_repository.py`
- `app/services/item_service.py` — `add_tag_to_item`, `remove_tag_from_item`
- `app/api/v1/endpoints/items.py` — two new routes

**New routes:**
```
POST   /api/v1/items/{id}/tags        body: {"name": "python"}  → 200 item with tags
DELETE /api/v1/items/{id}/tags/{name}                           → 200 item with tags
```

**Hints:**
<details>
<summary>Hint 1 — association table</summary>

```python
from sqlalchemy import Column, ForeignKey, Integer, String, Table
from app.core.database import Base

item_tags = Table(
    "item_tags",
    Base.metadata,
    Column("item_id", Integer, ForeignKey("items.id", ondelete="CASCADE")),
    Column("tag_id",  Integer, ForeignKey("tags.id",  ondelete="CASCADE")),
)
```
</details>

<details>
<summary>Hint 2 — Tag model</summary>

```python
class Tag(Base):
    __tablename__ = "tags"
    id:   Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    items: Mapped[list["Item"]] = relationship(secondary=item_tags, back_populates="tags")
```
</details>

**Bonus:** Add `GET /api/v1/tags/` to list all tags with their item count.

---

### Exercise 5 — Soft delete for Items

**Goal:** Instead of hard-deleting items, mark them with `deleted_at`. Soft-deleted items
must not appear in any list or get endpoint.

**Files to touch:**
- `app/models/item.py` — add `deleted_at: Mapped[datetime | None]`
- `app/repositories/item_repository.py` — filter `deleted_at.is_(None)` everywhere
- `app/services/item_service.py` — set `deleted_at = datetime.now(UTC)` instead of `repo.delete()`
- `app/api/v1/endpoints/items.py` — superuser-only `DELETE /api/v1/items/{id}/hard` to truly remove

**Acceptance criteria:**
```
DELETE /api/v1/items/1      → 200 (soft delete — item still in DB)
GET    /api/v1/items/1      → 404 (invisible to everyone)
GET    /api/v1/items/       → item 1 absent
```

**Bonus:** Add `GET /api/v1/admin/items/deleted` (superuser only) that lists soft-deleted items.

---

### Exercise 6 — User's public item feed

**Goal:** Add `GET /api/v1/users/{user_id}/items` — public endpoint listing a user's published items.

**Files to touch:**
- `app/api/v1/endpoints/users.py`
- `app/services/item_service.py`

**Acceptance criteria:**
```
GET /api/v1/users/99/items   → 404 if user does not exist
GET /api/v1/users/1/items    → 200 with paginated published items by user 1
```

**Bonus:** Add `?include_drafts=true` param that only works if the requester is the owner or superuser.

---

### Exercise 7 — Request rate limiting middleware

**Goal:** Limit each IP to **60 requests per minute**. Return `429 Too Many Requests` when exceeded.

**Files to create / touch:**
- `app/middleware/rate_limit.py`
- `app/main.py` — register the middleware
- `app/core/exceptions.py` — add `RateLimitException`

**Acceptance criteria:**
```
61 rapid requests from same IP → 61st returns 429
Different IP  → own fresh bucket
```

**Hints:**
<details>
<summary>Hint 1 — in-memory sliding window</summary>

```python
import time
from collections import defaultdict, deque

_buckets: dict[str, deque] = defaultdict(deque)
LIMIT = 60
WINDOW = 60  # seconds

def is_rate_limited(ip: str) -> bool:
    now = time.time()
    bucket = _buckets[ip]
    while bucket and bucket[0] < now - WINDOW:
        bucket.popleft()
    if len(bucket) >= LIMIT:
        return True
    bucket.append(now)
    return False
```
</details>

**Bonus:** Make the limit configurable via `Settings` (`RATE_LIMIT_PER_MINUTE: int = 60`).

---

## Phase 3 — Auth & Security

### Exercise 8 — Change password endpoint

**Goal:** Authenticated users can change their password by providing their current one first.

**New route:** `POST /api/v1/users/me/change-password`

**Request body:**
```json
{
  "current_password": "OldPass1",
  "new_password":     "NewPass2"
}
```

**Acceptance criteria:**
```
wrong current_password  → 400 "Current password is incorrect"
valid body              → 200 {"message": "Password changed successfully"}
login with new password → 200 (tokens returned)
```

**Files to touch:**
- `app/schemas/user.py` — new `ChangePasswordRequest` schema
- `app/services/user_service.py` — `change_password` method
- `app/api/v1/endpoints/users.py`

---

### Exercise 9 — Token blocklist (logout)

**Goal:** Add `POST /api/v1/auth/logout` that invalidates the current access token.

**Challenge:** JWTs are stateless — you need a server-side blocklist.

**Files to create / touch:**
- `app/core/token_blocklist.py` — in-memory `set` (later: Redis)
- `app/core/security.py` — `is_token_blocked(jti: str) -> bool`
- `app/core/dependencies.py` — check blocklist in `get_current_user`
- `app/api/v1/endpoints/auth.py`

**Hints:**
<details>
<summary>Hint 1 — JTI claim</summary>

Add a `jti` (JWT ID) claim when creating tokens:
```python
import uuid
payload["jti"] = str(uuid.uuid4())
```
Then store the jti in the blocklist on logout.
</details>

**Acceptance criteria:**
```
POST /api/v1/auth/logout  (with valid token)  → 200
GET  /api/v1/users/me     (with same token)   → 401
```

**Bonus:** Use a TTL-aware blocklist so entries expire automatically when the JWT would have expired anyway.

---

### Exercise 10 — Reusable permission decorator

**Goal:** Create a `require_superuser` dependency so routes don't repeat the same check.

**Instead of this in every superuser route:**
```python
if not current_user.is_superuser:
    raise ForbiddenException("Superuser access required.")
```

**Build this:**
```python
SuperUser = Annotated[User, Depends(require_superuser)]
```

**Files to touch:**
- `app/core/dependencies.py`
- `app/api/v1/endpoints/users.py` — refactor existing routes

---

## Phase 4 — Advanced

### Exercise 11 — Background task: welcome email

**Goal:** When a user registers, send a "welcome" log message asynchronously (simulating email).
Use FastAPI's built-in `BackgroundTasks`.

**Files to touch:**
- `app/utils/email.py` — `async def send_welcome_email(email: str, username: str) -> None`
  (just `logger.info(...)` for now)
- `app/api/v1/endpoints/users.py` — inject `BackgroundTasks`

**Hints:**
<details>
<summary>Hint — BackgroundTasks injection</summary>

```python
from fastapi import BackgroundTasks

@router.post("/")
async def register_user(
    db: DBSession,
    payload: UserCreate,
    background_tasks: BackgroundTasks,
) -> UserResponse:
    ...
    background_tasks.add_task(send_welcome_email, user.email, user.username)
    return UserResponse.model_validate(user)
```
</details>

**Bonus:** Replace the background task with a proper task queue using `asyncio.Queue`.

---

### Exercise 12 — User avatar upload

**Goal:** `POST /api/v1/users/me/avatar` accepts a JPEG/PNG file (max 2 MB) and saves it
to `uploads/avatars/{user_id}.{ext}`.

**Files to create / touch:**
- `app/utils/file_storage.py`
- `app/api/v1/endpoints/users.py`
- `app/models/user.py` — `avatar_url: Mapped[str | None]`
- `app/schemas/user.py` — include `avatar_url` in `UserResponse`

**Acceptance criteria:**
```
POST /api/v1/users/me/avatar  content-type: multipart/form-data  file=<image>
  → 200  {"avatar_url": "/uploads/avatars/1.jpg"}

File > 2 MB  → 413
Non-image    → 422
```

**Hints:**
<details>
<summary>Hint — UploadFile</summary>

```python
from fastapi import UploadFile, File

@router.post("/me/avatar")
async def upload_avatar(
    current_user: CurrentUser,
    file: UploadFile = File(...),
):
    if file.content_type not in ("image/jpeg", "image/png"):
        raise BadRequestException("Only JPEG and PNG are supported.")
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise BadRequestException("File size exceeds 2 MB.")
    ...
```
</details>

---

### Exercise 13 — Structured JSON logging

**Goal:** Replace the plain-text log format with JSON lines (one JSON object per log record)
so log aggregators (Datadog, Splunk) can parse them.

**Files to touch:**
- `app/main.py` — custom `logging.Formatter` subclass

**Expected output:**
```json
{"time": "2026-02-21T10:00:00Z", "level": "INFO", "logger": "api.access", "request_id": "a1b2c3d4", "method": "GET", "path": "/api/v1/users/me", "status": 200, "duration_ms": 12.4}
```

**Bonus:** Add a `correlation_id` passed in from a frontend via `X-Correlation-ID` request header.

---

### Exercise 14 — API versioning strategy

**Goal:** Create a `v2` router where `GET /api/v2/users/me` returns additional fields:
`item_count` and `last_login` (can be a stub value for now).

**Files to create:**
- `app/api/v2/__init__.py`
- `app/api/v2/endpoints/users.py`
- `app/api/v2/router.py`
- Update `app/main.py`

**Bonus:** Use a single shared service layer — only the schema and router differ between v1 and v2.

---

## Phase 5 — Testing

### Exercise 15 — Parametrize validation tests

**Goal:** Rewrite `test_register_weak_password` and `test_register_invalid_email` as a
single `@pytest.mark.parametrize` test covering 6+ invalid payloads.

**Target file:** `tests/test_users.py`

```python
@pytest.mark.parametrize("payload,expected_status", [
    ({"email": "bad",              "username": "u1", "password": "Password1"}, 422),
    ({"email": "x@x.com",         "username": "u2", "password": "weak"},      422),
    ({"email": "x@x.com",         "username": "u3", "password": "alllower1"}, 422),
    ({"email": "x@x.com",         "username": "ab", "password": "Password1"}, 422),  # short username
    ({"email": "x@x.com",         "username": "u5", "password": "NOUPPER1"},  422),  # no lowercase
    ({"email": "valid@example.com","username": "valid5","password": "Password1"}, 201),
])
async def test_registration_validation(client, payload, expected_status):
    ...
```

---

### Exercise 16 — Test pagination thoroughly

**Goal:** Create a test that seeds 25 items, then checks:
- `page=1&page_size=10` → 10 items, `pages=3`, `total=25`
- `page=3&page_size=10` → 5 items
- `page=4&page_size=10` → 0 items (or handle gracefully)
- `page_size=101`       → 422 (exceeds MAX_PAGE_SIZE)

---

### Exercise 17 — Factory fixtures with Faker

**Goal:** Install `Faker` and replace hardcoded test data with generated data.

```bash
pip install faker
```

Create `tests/factories.py`:
```python
from faker import Faker
from app.models.user import User
from app.core.security import hash_password

fake = Faker()

def make_user(**overrides) -> dict:
    return {
        "email":    fake.email(),
        "username": fake.user_name()[:20],
        "password": "Password1",
        **overrides,
    }
```

Then update `conftest.py` to use `make_user()` in fixtures.

---

### Exercise 18 — Test the rate limiter (Exercise 7 extension)

**Goal:** Write a pytest test that fires 61 rapid requests and asserts the 61st returns 429.

**Hints:**
<details>
<summary>Hint — asyncio gather</summary>

```python
import asyncio

async def test_rate_limit(client):
    tasks = [client.get("/health") for _ in range(61)]
    responses = await asyncio.gather(*tasks)
    status_codes = [r.status_code for r in responses]
    assert 429 in status_codes
```
</details>

---

## Quick Reference

### Run a single exercise test
```bash
pytest practice/exercises/ex02_test.py -v
```

### Regenerate the DB after model changes
```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

### Check your work compiles
```bash
python -m py_compile app/models/user.py   # catches syntax errors fast
python -c "from app.main import app"      # full import check
```

### Coverage report
```bash
pytest --cov=app --cov-report=html
# open htmlcov/index.html in browser
```

---

## Learning Checklist

After completing all exercises you will have hands-on experience with:

- [ ] SQLAlchemy async ORM — columns, relationships, many-to-many
- [ ] Alembic migrations — autogenerate, upgrade, downgrade
- [ ] Pydantic v2 — `field_validator`, `model_validator`, `computed_field`, generics
- [ ] FastAPI dependencies — `Depends`, `Annotated`, chaining deps
- [ ] JWT auth — access tokens, refresh tokens, token blocklist
- [ ] ASGI middleware — pure ASGI class, request ID, rate limiting
- [ ] Background tasks — `BackgroundTasks`, async queues
- [ ] File uploads — `UploadFile`, validation, storage
- [ ] pytest-asyncio — fixtures, parametrize, factories, coverage
- [ ] API versioning — multi-version router strategy
