"""
Application configuration using Pydantic BaseSettings.
All values are loaded from environment variables / .env file.
"""
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ───────────────────────────────────────────
    APP_NAME: str = "FastAPI Production"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: Literal["development", "staging", "production"] = "production"

    # ── API ───────────────────────────────────────────────────
    API_V1_PREFIX: str = "/api/v1"

    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"

    # ── Security ──────────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ──────────────────────────────────────────────────
    # Comma-separated in .env: ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    # ── Pagination ────────────────────────────────────────────
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # ── Computed helpers ──────────────────────────────────────
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def openapi_url(self) -> str | None:
        """Disable Swagger in production for security."""
        return "/openapi.json" if self.ENVIRONMENT != "production" else None


@lru_cache
def get_settings() -> Settings:
    """Cached settings — call this everywhere instead of importing Settings directly."""
    return Settings()  # type: ignore[call-arg]


settings: Settings = get_settings()
