import os
import uuid
from decimal import Decimal

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import Order, OrderItem
from ..publisher import publish_event

router = APIRouter(tags=["orders"])
bearer = HTTPBearer()

JWT_SECRET           = os.environ["JWT_SECRET"]
PAYMENT_SERVICE_URL  = os.environ["PAYMENT_SERVICE_URL"]


# ── Auth dependency ────────────────────────────────────────────────────────

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        return jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")


# ── Schemas ────────────────────────────────────────────────────────────────

class OrderItemIn(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: Decimal


class OrderCreate(BaseModel):
    items: list[OrderItemIn]


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    total_amount: Decimal
    items: list[dict]

    model_config = {"from_attributes": True}


# ── POST /orders — Create order ────────────────────────────────────────────
@router.post("/orders", status_code=201)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    total = sum(i.unit_price * i.quantity for i in data.items)
    order = Order(user_id=uuid.UUID(current_user["sub"]), total_amount=total)
    db.add(order)
    await db.flush()   # get order.id before adding items

    for i in data.items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=i.product_id,
            product_name=i.product_name,
            quantity=i.quantity,
            unit_price=i.unit_price,
        ))

    await db.commit()
    await db.refresh(order)

    # Publish event → notification-service sends "Order placed" email
    await publish_event("orders", "order.created", {
        "order_id": str(order.id),
        "user_id": str(order.user_id),
        "total": float(total),
    })

    return {"order_id": str(order.id), "status": order.status, "total": float(total)}


# ── GET /orders/{id} — Get order details ──────────────────────────────────
@router.get("/orders/{order_id}")
async def get_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    order = await db.scalar(select(Order).where(Order.id == order_id))
    if not order:
        raise HTTPException(404, "Order not found")
    if str(order.user_id) != current_user["sub"] and current_user.get("role") != "admin":
        raise HTTPException(403, "Forbidden")
    return order


# ── GET /orders — List my orders ───────────────────────────────────────────
@router.get("/orders")
async def list_orders(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.scalars(
        select(Order).where(Order.user_id == current_user["sub"])
    )
    return result.all()


# ── POST /orders/{id}/pay — Initiate payment ──────────────────────────────
@router.post("/orders/{order_id}/pay")
async def pay_order(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    order = await db.scalar(select(Order).where(Order.id == order_id))
    if not order:
        raise HTTPException(404, "Order not found")
    if str(order.user_id) != current_user["sub"]:
        raise HTTPException(403, "Forbidden")
    if order.status != "pending":
        raise HTTPException(400, f"Order is already {order.status}")

    # Delegate to payment-service
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{PAYMENT_SERVICE_URL}/payments/initiate",
            json={
                "order_id": order_id,
                "amount": float(order.total_amount),
                "currency": "USD",
                "idempotency_key": f"order-{order_id}",   # deterministic key
            },
            headers={"Authorization": f"Bearer {current_user.get('_raw_token', '')}"},
            timeout=10,
        )
    if r.status_code != 200:
        raise HTTPException(502, "Payment service error")

    order.status = "awaiting_payment"
    await db.commit()
    return r.json()
