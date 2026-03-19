from contextlib import asynccontextmanager
from fastapi import FastAPI
from .database import engine, Base
from .routes.payments import router
from .logging_config import setup_logging, RequestLoggingMiddleware

logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("payment-service starting up")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()
    logger.info("payment-service shut down")


app = FastAPI(title="Payment Service", version="1.0.0", lifespan=lifespan)
app.add_middleware(RequestLoggingMiddleware, logger=logger)
app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "payment-service"}
