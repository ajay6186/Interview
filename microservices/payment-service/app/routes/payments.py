"""
Payment routes — 100% gateway-agnostic.
Switch provider by setting PAYMENT_GATEWAY=stripe|razorpay in .env.
"""
import os
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..models import Payment, PaymentAuditLog
from ..security import encrypt
from ..publisher import publish_event
from ..gateway.factory import get_gateway

router     = APIRouter(tags=["payments"])
bearer     = HTTPBearer()
JWT_SECRET = os.environ["JWT_SECRET"]


# ── Auth dependency ────────────────────────────────────────────────────────

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        return jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")


# ── Schemas ────────────────────────────────────────────────────────────────

class InitiatePaymentRequest(BaseModel):
    order_id: str
    amount: Decimal
    currency: str = "USD"
    idempotency_key: str   # client MUST send this — prevents double-charge on retry


class RefundRequest(BaseModel):
    reason: str = "requested_by_customer"
    amount: Decimal | None = None  # None = full refund


# ── Audit helper ───────────────────────────────────────────────────────────

async def _audit(db: AsyncSession, payment_id: str, event: str, meta: dict) -> None:
    db.add(PaymentAuditLog(
        payment_id=payment_id,
        event=event,
        metadata_encrypted=encrypt(meta),   # AES-256-GCM
    ))
    await db.flush()


# ── POST /payments/initiate ────────────────────────────────────────────────
@router.post("/payments/initiate")
async def initiate_payment(
    data: InitiatePaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # IDEMPOTENCY: return cached result if this key was already used
    existing = await db.scalar(
        select(Payment).where(Payment.idempotency_key == data.idempotency_key)
    )
    if existing:
        return {
            "payment_id": str(existing.id),
            "status": existing.status,
            "idempotent": True,
        }

    gateway = get_gateway()
    result  = await gateway.create_payment(
        amount=data.amount,
        currency=data.currency,
        order_id=data.order_id,
        idempotency_key=data.idempotency_key,
        metadata={"user_id": current_user["sub"]},
    )

    payment = Payment(
        order_id=data.order_id,
        user_id=current_user["sub"],
        amount=data.amount,
        currency=data.currency.upper(),
        gateway=os.environ.get("PAYMENT_GATEWAY", "stripe"),
        idempotency_key=data.idempotency_key,
        gateway_order_id=result.gateway_order_id,
    )
    db.add(payment)
    await db.flush()

    await _audit(db, str(payment.id), "payment.initiated", {
        "order_id": data.order_id,
        "amount": float(data.amount),
        "gateway": payment.gateway,
        "gateway_order_id": result.gateway_order_id,
    })
    await db.commit()

    # Return only what the frontend needs
    response: dict = {"payment_id": str(payment.id), "status": "pending"}
    if result.client_secret:
        response["client_secret"] = result.client_secret   # Stripe.js
    if result.checkout_url:
        response["checkout_url"] = result.checkout_url     # Razorpay / PayPal hosted page
    return response


# ── POST /payments/webhook — Called by Stripe OR Razorpay ─────────────────
# No JWT auth — instead we verify the gateway's HMAC signature
@router.post("/webhook")
async def handle_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    headers = dict(request.headers)

    gateway = get_gateway()
    try:
        event = await gateway.parse_webhook(payload, headers)
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Find our Payment row by gateway_order_id
    payment = await db.scalar(
        select(Payment).where(Payment.gateway_order_id == event.gateway_order_id)
    )
    if not payment:
        return {"received": True}   # unknown order — ignore safely

    if event.event_type == "payment.succeeded":
        payment.status      = "succeeded"
        payment.gateway_txn_id = event.gateway_txn_id  # store for future refunds
        await _audit(db, str(payment.id), "payment.succeeded", {
            "gateway_txn_id": event.gateway_txn_id,
        })
        await db.commit()
        await publish_event("payment.succeeded", {
            "payment_id": str(payment.id),
            "order_id": payment.order_id,
            "user_id": payment.user_id,
            "amount": float(payment.amount),
        })

    elif event.event_type == "payment.failed":
        payment.status = "failed"
        await _audit(db, str(payment.id), "payment.failed", {"raw_event": str(event.raw)[:500]})
        await db.commit()
        await publish_event("payment.failed", {
            "payment_id": str(payment.id),
            "order_id": payment.order_id,
            "user_id": payment.user_id,
        })

    return {"received": True}


# ── GET /payments/{id} ─────────────────────────────────────────────────────
@router.get("/payments/{payment_id}")
async def get_payment(
    payment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    payment = await db.scalar(select(Payment).where(Payment.id == payment_id))
    if not payment:
        raise HTTPException(404, "Payment not found")
    if payment.user_id != current_user["sub"] and current_user.get("role") != "admin":
        raise HTTPException(403, "Forbidden")
    return {
        "id": str(payment.id),
        "order_id": payment.order_id,
        "gateway": payment.gateway,
        "amount": float(payment.amount),
        "currency": payment.currency,
        "status": payment.status,
        "created_at": payment.created_at,
    }


# ── POST /payments/{id}/refund ─────────────────────────────────────────────
@router.post("/payments/{payment_id}/refund")
async def refund_payment(
    payment_id: str,
    data: RefundRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ("admin", "support"):
        raise HTTPException(403, "Only admins/support can issue refunds")

    payment = await db.scalar(select(Payment).where(Payment.id == payment_id))
    if not payment:
        raise HTTPException(404, "Payment not found")
    if payment.status != "succeeded":
        raise HTTPException(400, f"Cannot refund payment with status '{payment.status}'")
    if not payment.gateway_txn_id:
        raise HTTPException(400, "No transaction ID on record — refund not possible")

    gateway = get_gateway()
    result  = await gateway.refund(
        gateway_txn_id=payment.gateway_txn_id,
        amount=data.amount,
        reason=data.reason,
    )

    payment.status = "refunded"
    await _audit(db, str(payment.id), "payment.refunded", {
        "gateway_refund_id": result.gateway_refund_id,
        "initiated_by": current_user["sub"],
        "reason": data.reason,
        "amount": float(data.amount) if data.amount else "full",
    })
    await db.commit()

    await publish_event("payment.refunded", {
        "payment_id": str(payment.id),
        "order_id": payment.order_id,
        "user_id": payment.user_id,
    })

    return {"status": "refunded", "gateway_refund_id": result.gateway_refund_id}
