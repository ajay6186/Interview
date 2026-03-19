"""
To add a new gateway:
  1. Create payment-service/app/gateway/myprovider_gateway.py
  2. Add one line here in the registry.
  3. Set PAYMENT_GATEWAY=myprovider in .env — done.
"""
import os
from .base import PaymentGateway

_REGISTRY: dict[str, type[PaymentGateway]] = {}


def _register():
    from .stripe_gateway   import StripeGateway
    from .razorpay_gateway import RazorpayGateway
    from .paytm_gateway    import PaytmGateway
    _REGISTRY["stripe"]   = StripeGateway
    _REGISTRY["razorpay"] = RazorpayGateway
    _REGISTRY["paytm"]    = PaytmGateway


def get_gateway() -> PaymentGateway:
    if not _REGISTRY:
        _register()
    name = os.environ.get("PAYMENT_GATEWAY", "stripe").lower()
    cls  = _REGISTRY.get(name)
    if cls is None:
        raise ValueError(f"Unsupported PAYMENT_GATEWAY='{name}'. Available: {list(_REGISTRY)}")
    return cls()
