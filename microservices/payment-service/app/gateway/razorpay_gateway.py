import asyncio
import hashlib
import hmac
import json
import os
from decimal import Decimal

import razorpay

from .base import PaymentGateway, PaymentResult, WebhookEvent, RefundResult

# Razorpay event → our normalised event type
_EVENT_MAP = {
    "payment.captured": "payment.succeeded",
    "payment.failed":   "payment.failed",
    "refund.created":   "payment.refunded",
}


class RazorpayGateway(PaymentGateway):
    """
    Razorpay flow:
      1. Backend creates a Razorpay Order → returns order_id
      2. Frontend uses Razorpay Checkout JS (with order_id + key_id)
      3. Customer pays → Razorpay fires webhook → we confirm payment
    """

    def __init__(self) -> None:
        self._client = razorpay.Client(
            auth=(
                os.environ["RAZORPAY_KEY_ID"],
                os.environ["RAZORPAY_KEY_SECRET"],
            )
        )
        self._webhook_secret = os.environ["RAZORPAY_WEBHOOK_SECRET"]

    # ── Create Razorpay Order ─────────────────────────────────────────────
    async def create_payment(
        self,
        amount: Decimal,
        currency: str,
        order_id: str,
        idempotency_key: str,
        metadata: dict,
    ) -> PaymentResult:
        rz_order = await asyncio.to_thread(
            self._client.order.create,
            {
                "amount": int(amount * 100),   # paise (INR smallest unit)
                "currency": currency.upper(),
                "receipt": order_id[:40],      # Razorpay receipt max 40 chars
                "notes": {k: str(v) for k, v in {**metadata, "order_id": order_id}.items()},
            },
        )
        return PaymentResult(
            gateway_order_id=rz_order["id"],   # rzp_order_XXXX
            client_secret=None,                # Razorpay uses JS checkout, not client_secret
            checkout_url=None,                 # frontend uses Razorpay.js with order_id + key_id
            status="pending",
            raw=rz_order,
        )

    # ── Verify + parse webhook ────────────────────────────────────────────
    async def parse_webhook(self, payload: bytes, headers: dict) -> WebhookEvent:
        signature = headers.get("x-razorpay-signature", "")

        # HMAC-SHA256 verification
        mac      = hmac.new(self._webhook_secret.encode(), payload, hashlib.sha256)
        expected = mac.hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise ValueError("Razorpay webhook signature mismatch")

        data       = json.loads(payload)
        event_name = data.get("event", "")
        event_type = _EVENT_MAP.get(event_name)

        if event_type is None:
            raise ValueError(f"Unhandled Razorpay event: {event_name}")

        entity = data["payload"]["payment"]["entity"]

        return WebhookEvent(
            event_type=event_type,
            gateway_order_id=entity.get("order_id", ""),   # rzp_order_XXXX
            gateway_txn_id=entity.get("id", ""),           # rzp_pay_XXXX (needed for refunds)
            raw=data,
        )

    # ── Refund ────────────────────────────────────────────────────────────
    async def refund(
        self,
        gateway_txn_id: str,          # razorpay_payment_id (rzp_pay_XXXX)
        amount: Decimal | None = None,
        reason: str = "requested_by_customer",
    ) -> RefundResult:
        kwargs: dict = {"notes": {"reason": reason}}
        if amount:
            kwargs["amount"] = int(amount * 100)
        refund = await asyncio.to_thread(
            self._client.payment.refund, gateway_txn_id, kwargs
        )
        return RefundResult(gateway_refund_id=refund["id"], status="succeeded")
