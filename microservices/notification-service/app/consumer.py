"""
Listens to RabbitMQ events and sends email notifications.
Runs as a background consumer — no HTTP server needed.
"""
import os
import json
import logging
import socket
import asyncio
import aio_pika
import aiosmtplib
from datetime import datetime, timezone
from email.message import EmailMessage

# ── Structured JSON logging ─────────────────────────────────────────────────
LOGSTASH_HOST = os.environ.get("LOGSTASH_HOST", "logstash")
LOGSTASH_PORT = int(os.environ.get("LOGSTASH_PORT", "5000"))
SERVICE_NAME  = os.environ.get("SERVICE_NAME", "notification-service")


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        return json.dumps({
            "@timestamp": datetime.now(timezone.utc).isoformat(),
            "level":      record.levelname,
            "service":    SERVICE_NAME,
            "message":    record.getMessage(),
            **({"event": record.event} if hasattr(record, "event") else {}),
            **({"exception": self.formatException(record.exc_info)} if record.exc_info else {}),
        })


def _setup_logger() -> logging.Logger:
    fmt      = _JsonFormatter()
    console  = logging.StreamHandler()
    console.setFormatter(fmt)
    handlers: list[logging.Handler] = [console]
    try:
        class _TCP(logging.Handler):
            def emit(self, r):
                try:
                    with socket.create_connection((LOGSTASH_HOST, LOGSTASH_PORT), timeout=2) as s:
                        s.sendall((fmt.format(r) + "\n").encode())
                except Exception:
                    pass
        tcp = _TCP()
        handlers.append(tcp)
    except Exception:
        pass
    logging.basicConfig(level=logging.INFO, handlers=handlers, force=True)
    return logging.getLogger(SERVICE_NAME)


log = _setup_logger()
# ────────────────────────────────────────────────────────────────────────────


RABBITMQ_URL = os.environ["RABBITMQ_URL"]
SMTP_HOST    = os.environ["SMTP_HOST"]
SMTP_PORT    = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER    = os.environ["SMTP_USER"]
SMTP_PASS    = os.environ["SMTP_PASS"]
FROM_EMAIL   = os.environ["FROM_EMAIL"]


async def send_email(to: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"]    = FROM_EMAIL
    msg["To"]      = to
    msg["Subject"] = subject
    msg.set_content(body)
    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_PASS,
        start_tls=True,
    )


async def handle_message(message: aio_pika.IncomingMessage) -> None:
    async with message.process():
        payload      = json.loads(message.body)
        routing_key  = message.routing_key
        log.info(f"Event received: {routing_key}", extra={"event": routing_key})

        # Route to right email template based on event type
        if routing_key == "order.created":
            await send_email(
                to=payload.get("user_email", ""),
                subject="Order Placed",
                body=f"Your order #{payload['order_id']} has been placed. Total: ${payload['total']:.2f}",
            )

        elif routing_key == "payment.succeeded":
            await send_email(
                to=payload.get("user_email", ""),
                subject="Payment Confirmed",
                body=f"Payment for order #{payload['order_id']} was successful. Amount: ${payload['amount']:.2f}",
            )

        elif routing_key == "payment.failed":
            await send_email(
                to=payload.get("user_email", ""),
                subject="Payment Failed",
                body=f"Payment for order #{payload['order_id']} failed. Please retry.",
            )

        elif routing_key == "payment.refunded":
            await send_email(
                to=payload.get("user_email", ""),
                subject="Refund Processed",
                body=f"Your refund for order #{payload['order_id']} has been processed.",
            )


async def start_consumer() -> None:
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    channel    = await connection.channel()
    await channel.set_qos(prefetch_count=10)

    # Subscribe to both exchanges
    for exchange_name in ("orders", "payments"):
        exchange = await channel.declare_exchange(
            exchange_name, aio_pika.ExchangeType.TOPIC, durable=True
        )
        queue = await channel.declare_queue(
            f"notification.{exchange_name}", durable=True
        )
        await queue.bind(exchange, routing_key="#")   # receive all events
        await queue.consume(handle_message)

    log.info("Consumer started. Waiting for events...")
    await asyncio.Future()   # run forever
