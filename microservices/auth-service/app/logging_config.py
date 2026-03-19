"""
Structured JSON logging with Logstash TCP shipping.
Import and call setup_logging() once at app startup.
"""
import json
import logging
import os
import socket
import time
import uuid
from datetime import datetime, timezone

LOGSTASH_HOST = os.environ.get("LOGSTASH_HOST", "logstash")
LOGSTASH_PORT = int(os.environ.get("LOGSTASH_PORT", "5000"))
SERVICE_NAME  = os.environ.get("SERVICE_NAME", "auth-service")


class JsonFormatter(logging.Formatter):
    """Formats log records as a single-line JSON string."""

    def format(self, record: logging.LogRecord) -> str:
        log: dict = {
            "@timestamp": datetime.now(timezone.utc).isoformat(),
            "level":      record.levelname,
            "service":    SERVICE_NAME,
            "logger":     record.name,
            "message":    record.getMessage(),
        }
        for field in ("request_id", "method", "path", "status_code", "duration_ms", "user_id"):
            if hasattr(record, field):
                log[field] = getattr(record, field)
        if record.exc_info:
            log["exception"] = self.formatException(record.exc_info)
        return json.dumps(log)


class LogstashTCPHandler(logging.Handler):
    """Sends each log record to Logstash over a plain TCP connection."""

    def __init__(self, host: str, port: int) -> None:
        super().__init__()
        self.host = host
        self.port = port

    def emit(self, record: logging.LogRecord) -> None:
        try:
            line = self.format(record) + "\n"
            with socket.create_connection((self.host, self.port), timeout=2) as sock:
                sock.sendall(line.encode("utf-8"))
        except Exception:
            pass


def setup_logging() -> logging.Logger:
    """Configure root logger: JSON → stdout + Logstash TCP."""
    formatter = JsonFormatter()

    console = logging.StreamHandler()
    console.setFormatter(formatter)

    handlers: list[logging.Handler] = [console]
    try:
        tcp = LogstashTCPHandler(LOGSTASH_HOST, LOGSTASH_PORT)
        tcp.setFormatter(formatter)
        handlers.append(tcp)
    except Exception:
        pass

    logging.basicConfig(level=logging.INFO, handlers=handlers, force=True)

    for noisy in ("uvicorn.access", "sqlalchemy.engine", "asyncio"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    return logging.getLogger(SERVICE_NAME)


from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs every HTTP request with method, path, status code, and latency."""

    def __init__(self, app, logger: logging.Logger) -> None:
        super().__init__(app)
        self.logger = logger

    async def dispatch(self, request: Request, call_next):
        request_id = uuid.uuid4().hex[:8]
        start      = time.perf_counter()

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        level = logging.ERROR if response.status_code >= 500 else (
                logging.WARNING if response.status_code >= 400 else logging.INFO)

        self.logger.log(
            level,
            f"{request.method} {request.url.path} {response.status_code} ({duration_ms}ms)",
            extra={
                "request_id":  request_id,
                "method":      request.method,
                "path":        str(request.url.path),
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response
