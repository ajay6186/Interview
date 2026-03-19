import asyncio
import os
from decimal import Decimal

import stripe

from .base import PaymentGateway, PaymentResult, WebhookEvent, RefundResult

# Stripe event → our normalised event type
_EVENT_MAP = {
    "payment_intent.succeeded":      "payment.succeeded",
    "payment_intent.payment_failed": "payment.failed",
    "charge.refunded":               "payment.refunded",
}


class StripeGateway(PaymentGateway):
    def __init__(self) -> None:
        stripe.api_key       = os.environ["STRIPE_SECRET_KEY"]
        self._webhook_secret = os.environ["STRIPE_WEBHOOK_SECRET"]

    # ── Create PaymentIntent ──────────────────────────────────────────────
    async def create_payment(
        self,
        amount: Decimal,
        currency: str,
        order_id: str,
        idempotency_key: str,
        metadata: dict,
    ) -> PaymentResult:
        intent = await asyncio.to_thread(
            stripe.PaymentIntent.create,
            amount=int(amount * 100),       # Stripe uses smallest unit (cents)
            currency=currency.lower(),
            metadata={"order_id": order_id, **{k: str(v) for k, v in metadata.items()}},
            idempotency_key=idempotency_key,
        )
        return PaymentResult(
            gateway_order_id=intent["id"],
            client_secret=intent["client_secret"],  # returned to frontend for Stripe.js
            checkout_url=None,
            status="pending",
            raw=dict(intent),
        )

    # ── Verify + parse webhook ────────────────────────────────────────────
    async def parse_webhook(self, payload: bytes, headers: dict) -> WebhookEvent:
        signature = headers.get("stripe-signature", "")
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, self._webhook_secret
            )
        except stripe.error.SignatureVerificationError as e:
            raise ValueError(f"Stripe signature invalid: {e}")

        event_obj  = event["data"]["object"]
        event_type = _EVENT_MAP.get(event["type"])

        if event_type is None:
            raise ValueError(f"Unhandled Stripe event: {event['type']}")

        # For "charge.refunded" the object is a charge, not a payment_intent
        gateway_order_id = (
            event_obj.get("payment_intent") or event_obj.get("id")
        )
        gateway_txn_id = event_obj.get("id")

        return WebhookEvent(
            event_type=event_type,
            gateway_order_id=gateway_order_id,
            gateway_txn_id=gateway_txn_id,
            raw=dict(event),
        )

    # ── Refund ────────────────────────────────────────────────────────────
    async def refund(
        self,
        gateway_txn_id: str,
        amount: Decimal | None = None,
        reason: str = "requested_by_customer",
    ) -> RefundResult:
        kwargs: dict = {"payment_intent": gateway_txn_id, "reason": reason}
        if amount:
            kwargs["amount"] = int(amount * 100)
        refund = await asyncio.to_thread(stripe.Refund.create, **kwargs)
        return RefundResult(gateway_refund_id=refund["id"], status="succeeded")
