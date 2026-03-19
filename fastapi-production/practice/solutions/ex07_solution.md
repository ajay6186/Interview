# Exercise 7 Solution — Rate Limiting Middleware

---

## Step 1 — Exception (`app/core/exceptions.py`)

```python
class RateLimitException(AppException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    detail = "Too many requests. Please slow down."
```

---

## Step 2 — Middleware (`app/middleware/rate_limit.py`)

```python
import time
from collections import defaultdict, deque
from typing import Any
from collections.abc import Callable, Coroutine

from app.core.config import settings

Scope = dict[str, Any]
Receive = Callable[[], Coroutine[Any, Any, dict]]
Send = Callable[[dict], Coroutine[Any, Any, None]]

_buckets: dict[str, deque] = defaultdict(deque)


def _is_rate_limited(ip: str) -> bool:
    now = time.time()
    bucket = _buckets[ip]
    # remove timestamps older than 60 seconds
    while bucket and bucket[0] < now - 60:
        bucket.popleft()
    if len(bucket) >= settings.RATE_LIMIT_PER_MINUTE:
        return True
    bucket.append(now)
    return False


class RateLimitMiddleware:
    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        client = scope.get("client")
        ip = client[0] if client else "unknown"

        if _is_rate_limited(ip):
            response = {
                "type": "http.response.start",
                "status": 429,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"retry-after", b"60"),
                ],
            }
            await send(response)
            await send({
                "type": "http.response.body",
                "body": b'{"detail":"Too many requests. Please slow down."}',
            })
            return

        await self.app(scope, receive, send)
```

---

## Step 3 — Settings (`app/core/config.py`)

```python
RATE_LIMIT_PER_MINUTE: int = 60
```

---

## Step 4 — Register (`app/main.py`)

```python
from app.middleware.rate_limit import RateLimitMiddleware

app.add_middleware(RateLimitMiddleware)   # add after LoggingMiddleware
```
