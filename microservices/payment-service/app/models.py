import uuid
from decimal import Decimal
from sqlalchemy import String, Text, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from .database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID]  = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[str]  = mapped_column(String(100), nullable=False, index=True)
    user_id: Mapped[str]   = mapped_column(String(100), nullable=False, index=True)
    amount: Mapped[Decimal]= mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str]  = mapped_column(String(3), nullable=False, default="USD")
    status: Mapped[str]    = mapped_column(String(20), nullable=False, default="pending")
    # pending → succeeded | failed | refunded

    # ── Gateway fields ───────────────────────────────────────────────────────
    gateway: Mapped[str]   = mapped_column(String(20), nullable=False)
    # "stripe" | "razorpay" — which provider processed this payment

    idempotency_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    # SECURITY: prevents double-charge on network retries

    gateway_order_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    # Stripe: payment_intent_id | Razorpay: order_id (rzp_order_XXX)
    # Used to match incoming webhooks back to this row

    gateway_txn_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    # Stripe: payment_intent_id (same) | Razorpay: payment_id (rzp_pay_XXX)
    # Populated after payment captured; used for refunds

    created_at = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PaymentAuditLog(Base):
    """Immutable audit trail — never deleted. Every state change is logged."""
    __tablename__ = "payment_audit_logs"

    id: Mapped[uuid.UUID]   = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    event: Mapped[str]      = mapped_column(String(100), nullable=False)
    # "payment.initiated" | "payment.succeeded" | "payment.failed" | "payment.refunded"

    metadata_encrypted: Mapped[str | None] = mapped_column(Text)
    # AES-256-GCM encrypted JSON — see security.py

    created_at = mapped_column(DateTime(timezone=True), server_default=func.now())
