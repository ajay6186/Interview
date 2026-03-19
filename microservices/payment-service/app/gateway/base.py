"""
Gateway abstraction (Strategy Pattern).

Adding a new payment provider = implement PaymentGateway + register in factory.py.
The rest of the codebase stays unchanged.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class PaymentResult:
    gateway_order_id: str     # ID created at initiation (Stripe: intent_id, Razorpay: order_id)
    client_secret: str | None # Stripe.js uses this to render card UI
    checkout_url: str | None  # Razorpay / PayPal redirect URL for hosted checkout
    status: str               # always "pending" at creation time
    raw: dict                 # full gateway response for debugging/audit


@dataclass
class WebhookEvent:
    """Normalised event — gateway-specific fields are abstracted away."""
    event_type: str             # "payment.succeeded" | "payment.failed" | "payment.refunded"
    gateway_order_id: str       # match back to our Payment row
    gateway_txn_id: str | None  # actual transaction/payment ID (needed for refunds)
    raw: dict


@dataclass
class RefundResult:
    gateway_refund_id: str
    status: str


class PaymentGateway(ABC):
    """Every gateway must implement these three operations."""

    @abstractmethod
    async def create_payment(
        self,
        amount: Decimal,
        currency: str,
        order_id: str,
        idempotency_key: str,
        metadata: dict,
    ) -> PaymentResult: ...

    @abstractmethod
    async def parse_webhook(
        self,
        payload: bytes,
        headers: dict,
    ) -> WebhookEvent:
        """Verify signature + parse into a normalised WebhookEvent."""
        ...

    @abstractmethod
    async def refund(
        self,
        gateway_txn_id: str,           # the actual payment/transaction ID
        amount: Decimal | None = None,  # None = full refund
        reason: str = "requested_by_customer",
    ) -> RefundResult: ...
