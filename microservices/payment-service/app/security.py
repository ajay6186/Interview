"""AES-256-GCM encryption for sensitive payment metadata stored in the DB."""
import os
import json
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# ENCRYPTION_KEY must be exactly 32 hex bytes (64 hex chars) — set via env
_key = bytes.fromhex(os.environ.get("ENCRYPTION_KEY", "0" * 64))
_gcm = AESGCM(_key)


def encrypt(data: dict) -> str:
    """Returns base64(nonce + ciphertext)."""
    nonce      = os.urandom(12)              # 96-bit nonce — unique per encryption
    plaintext  = json.dumps(data).encode()
    ciphertext = _gcm.encrypt(nonce, plaintext, None)
    return base64.b64encode(nonce + ciphertext).decode()


def decrypt(blob: str) -> dict:
    raw        = base64.b64decode(blob)
    nonce      = raw[:12]
    ciphertext = raw[12:]
    plaintext  = _gcm.decrypt(nonce, ciphertext, None)
    return json.loads(plaintext)
