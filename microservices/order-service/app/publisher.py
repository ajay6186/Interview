"""Publishes domain events to RabbitMQ for async consumers (notification-service, etc.)."""
import os
import json
import aio_pika


async def publish_event(exchange_name: str, routing_key: str, payload: dict) -> None:
    connection = await aio_pika.connect_robust(os.environ["RABBITMQ_URL"])
    async with connection:
        channel  = await connection.channel()
        exchange = await channel.declare_exchange(
            exchange_name, aio_pika.ExchangeType.TOPIC, durable=True
        )
        await exchange.publish(
            aio_pika.Message(
                body=json.dumps(payload).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            ),
            routing_key=routing_key,
        )
