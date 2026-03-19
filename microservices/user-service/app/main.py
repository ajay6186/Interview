from contextlib import asynccontextmanager
from fastapi import FastAPI
from .database import engine, Base
from .routes.users import router
from .logging_config import setup_logging, RequestLoggingMiddleware

logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("user-service starting up")
    # Create tables on startup (use Alembic in real prod)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()
    logger.info("user-service shut down")


app = FastAPI(title="User Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(RequestLoggingMiddleware, logger=logger)
app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "user-service"}
