# Exercise 1 Solution — Add `bio` field to User

> Try to solve it yourself first! Only read this after a genuine attempt.

---

## Step 1 — ORM model (`app/models/user.py`)

```python
# add this line after full_name
bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
```

---

## Step 2 — Schemas (`app/schemas/user.py`)

### UserCreate
```python
bio: str | None = Field(default=None, max_length=500)
```

### UserUpdate
```python
bio: str | None = Field(default=None, max_length=500)
```
Update the `at_least_one_field` validator to include `self.bio`.

### UserResponse
```python
bio: str | None
```

---

## Step 3 — Migration

```bash
alembic revision --autogenerate -m "add user bio"
alembic upgrade head
```

---

## Step 4 — Service (`app/services/user_service.py`)

No changes needed — `update_user` already calls `model_dump(exclude_none=True)`
and passes the result to `repo.update()`, so `bio` is handled automatically.

---

## Bonus — Reject bios with URLs

```python
import re
_URL_RE = re.compile(r"https?://|www\.")

@field_validator("bio")
@classmethod
def no_urls_in_bio(cls, v: str | None) -> str | None:
    if v and _URL_RE.search(v):
        raise ValueError("Bio must not contain URLs.")
    return v
```
