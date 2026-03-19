"""
Paytm Payment Gateway — using Paytm Payment Gateway SDK / REST API.

Paytm flow:
  1. Backend creates a transaction token via Paytm API (initiate txn)
  2. Frontend loads Paytm checkout JS using the token
  3. Customer pays → Paytm sends S2S callback (webhook) → we verify checksum
  4. We confirm via Paytm Transaction Status API (always verify — never trust callback alone)

Docs: https://developer.paytm.com/docs/
"""
import asyncio
import hashlib
import hmac
import json
import os
from decimal import Decimal

import httpx

from .base import PaymentGateway, PaymentResult, WebhookEvent, RefundResult

# Paytm event → our normalised event type
_TXN_STATUS_MAP = {
    "TXN_SUCCESS": "payment.succeeded",
    "TXN_FAILURE": "payment.failed",
    "PENDING":     None,   # ignore pending — wait for final status
}

PAYTM_BASE_URL = os.environ.get(
    "PAYTM_BASE_URL",
    "https://securegw-stage.paytm.in",   # use securegw.paytm.in in production
)


def _paytm_checksum(params: dict, merchant_key: str) -> str:
    """
    Paytm uses HMAC-SHA256 over a pipe-separated sorted param string.
    Ref: https://developer.paytm.com/docs/checksum/
    """
    sorted_values = "|".join(str(params[k]) for k in sorted(params.keys()))
    mac = hmac.new(merchant_key.encode(), sorted_values.encode(), hashlib.sha256)
    return mac.hexdigest()


def _verify_checksum(params: dict, checksum: str, merchant_key: str) -> bool:
    expected = _paytm_checksum(params, merchant_key)
    return hmac.compare_digest(expected, checksum)


class PaytmGateway(PaymentGateway):

    def __init__(self) -> None:
        self._mid            = os.environ["PAYTM_MERCHANT_ID"]
        self._merchant_key   = os.environ["PAYTM_MERCHANT_KEY"]
        self._website        = os.environ.get("PAYTM_WEBSITE", "WEBSTAGING")
        self._industry_type  = os.environ.get("PAYTM_INDUSTRY_TYPE", "Retail")
        self._channel_id     = os.environ.get("PAYTM_CHANNEL_ID", "WEB")

    # ── Initiate transaction — get token for Paytm Checkout JS ────────────
    async def create_payment(
        self,
        amount: Decimal,
        currency: str,
        order_id: str,
        idempotency_key: str,
        metadata: dict,
    ) -> PaymentResult:
        params = {
            "MID":          self._mid,
            "ORDER_ID":     idempotency_key,   # unique per transaction
            "CUST_ID":      metadata.get("user_id", "guest"),
            "TXN_AMOUNT":   f"{amount:.2f}",
            "CURRENCY":     currency.upper(),
            "WEBSITE":      self._website,
            "INDUSTRY_TYPE_ID": self._industry_type,
            "CHANNEL_ID":   self._channel_id,
            "CALLBACK_URL": os.environ.get("PAYTM_CALLBACK_URL", ""),
        }
        params["CHECKSUMHASH"] = _paytm_checksum(params, self._merchant_key)

        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{PAYTM_BASE_URL}/theia/api/v1/initiateTransaction",
                json={"body": params},
                timeout=15,
            )
        r.raise_for_status()
        data = r.json()

        txn_token = data.get("body", {}).get("txnToken", "")
        return PaymentResult(
            gateway_order_id=idempotency_key,    # our ORDER_ID
            client_secret=txn_token,             # used by Paytm Checkout JS
            checkout_url=None,
            status="pending",
            raw=data,
        )

    # ── Verify S2S callback checksum ──────────────────────────────────────
    async def parse_webhook(self, payload: bytes, headers: dict) -> WebhookEvent:
        try:
            params = json.loads(payload)
        except Exception:
            # Paytm sends form-encoded in some versions
            from urllib.parse import parse_qs
            parsed = parse_qs(payload.decode())
            params = {k: v[0] for k, v in parsed.items()}

        checksum = params.pop("CHECKSUMHASH", "")
        if not _verify_checksum(params, checksum, self._merchant_key):
            raise ValueError("Paytm checksum verification failed")

        # IMPORTANT: Always verify transaction status via Paytm API
        # Never trust the callback alone — verify before marking succeeded
        status_params = {
            "MID":      self._mid,
            "ORDERID":  params.get("ORDERID", ""),
        }
        status_params["CHECKSUMHASH"] = _paytm_checksum(status_params, self._merchant_key)

        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{PAYTM_BASE_URL}/v3/order/status",
                json={"body": status_params},
                timeout=15,
            )
        r.raise_for_status()
        status_data = r.json().get("body", {})

        txn_status = status_data.get("resultInfo", {}).get("resultCode", "TXN_FAILURE")
        event_type = _TXN_STATUS_MAP.get(txn_status)

        if event_type is None:
            raise ValueError(f"Unhandled Paytm status: {txn_status}")

        return WebhookEvent(
            event_type=event_type,
            gateway_order_id=params.get("ORDERID", ""),
            gateway_txn_id=status_data.get("txnId", ""),
            raw=status_data,
        )

    # ── Refund ─────────────────────────────────────────────────────────────
    async def refund(
        self,
        gateway_txn_id: str,
        amount: Decimal | None = None,
        reason: str = "requested_by_customer",
    ) -> RefundResult:
        import uuid
        ref_id = str(uuid.uuid4())[:20]

        params = {
            "MID":      self._mid,
            "TXNID":    gateway_txn_id,
            "REFUNDID": ref_id,
        }
        if amount:
            params["REFUND_AMOUNT"] = f"{amount:.2f}"

        params["CHECKSUMHASH"] = _paytm_checksum(params, self._merchant_key)

        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{PAYTM_BASE_URL}/v2/refund/apply",
                json={"body": params},
                timeout=15,
            )
        r.raise_for_status()
        data = r.json().get("body", {})

        return RefundResult(
            gateway_refund_id=data.get("refundId", ref_id),
            status="succeeded",
        )
