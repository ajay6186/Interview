"""Entry point — runs the RabbitMQ consumer (no HTTP server needed)."""
import asyncio
from .consumer import start_consumer

if __name__ == "__main__":
    asyncio.run(start_consumer())
