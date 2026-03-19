# Exercise 9 Solution — Token blocklist (logout)

---

## Step 1 — Blocklist store (`app/core/token_blocklist.py`)

```python
"""
In-memory token blocklist.
Production note: replace with Redis SETEX so tokens auto-expire.
"""
_blocked_jtis: set[str] = set()


def block_token(jti: str) -> None:
    _blocked_jtis.add(jti)


def is_blocked(jti: str) -> bool:
    return jti in _blocked_jtis
```

---

## Step 2 — Add `jti` to token creation (`app/core/security.py`)

```python
import uuid

def _create_token(subject, expires_delta, extra=None):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "iat": now,
        "exp": now + expires_delta,
        "jti": str(uuid.uuid4()),   # ← unique token ID
        **(extra or {}),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
```

---

## Step 3 — Check blocklist in dependency (`app/core/dependencies.py`)

```python
from app.core.token_blocklist import is_blocked

async def get_current_user(db, credentials):
    ...
    try:
        payload = decode_token(credentials.credentials)
        jti = payload.get("jti")
        if jti and is_blocked(jti):
            raise UnauthorizedException("Token has been revoked.")
        ...
```

---

## Step 4 — Logout endpoint (`app/api/v1/endpoints/auth.py`)

```python
from app.core.token_blocklist import block_token

@router.post("/logout", response_model=MessageResponse, summary="Logout — revoke current token")
async def logout(
    current_user: CurrentUser,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> MessageResponse:
    payload = decode_token(credentials.credentials)
    jti = payload.get("jti")
    if jti:
        block_token(jti)
    return MessageResponse(message="Logged out successfully.")
```

---

## Bonus — TTL-aware blocklist

```python
import time
from dataclasses import dataclass, field

@dataclass
class _Entry:
    expires_at: float   # unix timestamp

_store: dict[str, _Entry] = {}

def block_token(jti: str, expires_at: float) -> None:
    _store[jti] = _Entry(expires_at=expires_at)

def is_blocked(jti: str) -> bool:
    entry = _store.get(jti)
    if entry is None:
        return False
    if time.time() > entry.expires_at:
        del _store[jti]   # lazy cleanup
        return False
    return True
```

Pass `exp` from the decoded payload as `expires_at` when calling `block_token`.
