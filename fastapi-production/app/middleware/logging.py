"""
Request / response logging middleware — pure ASGI implementation.

Using a pure ASGI class instead of BaseHTTPMiddleware avoids the
exception-group wrapping issue introduced in Starlette 0.41+ which
can interfere with FastAPI's built-in exception handlers.
"""
import logging
import time
import uuid
from collections.abc import Callable, Coroutine
from typing import Any

logger = logging.getLogger("api.access")

# ASGI type aliases
Scope = dict[str, Any]
Receive = Callable[[], Coroutine[Any, Any, dict]]
Send = Callable[[dict], Coroutine[Any, Any, None]]


class LoggingMiddleware:
    """
    Wraps every HTTP request/response with structured access logs and
    injects an X-Request-ID header for distributed tracing.
    """

    def __init__(self, app: Any) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = str(uuid.uuid4())[:8]
        scope.setdefault("state", {})["request_id"] = request_id

        start = time.perf_counter()
        method = scope.get("method", "")
        path = scope.get("path", "")

        status_code = 0

        async def send_wrapper(message: dict) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                # Inject X-Request-ID into response headers
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode()))
                message = {**message, "headers": headers}
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.info(
                "[%s] %s %s → %d (%.1fms)",
                request_id,
                method,
                path,
                status_code,
                elapsed_ms,
            )
