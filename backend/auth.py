from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from config import settings
import json
import base64
import logging
import re

security = HTTPBearer()
security_logger = logging.getLogger("security")

# Clerk issuer pattern - validates the token comes from Clerk
CLERK_ISSUER_PATTERN = re.compile(r"^https://[\w-]+\.clerk\.accounts\.dev$|^https://clerk\.[\w-]+\.\w+$")


def _get_public_key() -> str:
    """
    Return the Clerk RSA public key in PEM format.
    Accepts either:
      - A raw PEM string (starts with '-----BEGIN')
      - A base64-encoded PEM string (for env safety)
    """
    raw = settings.clerk_jwt_public_key.strip()
    if raw.startswith("-----BEGIN"):
        return raw
    # Try base64 decode
    try:
        return base64.b64decode(raw).decode("utf-8")
    except Exception:
        return raw


def _validate_issuer(issuer: str | None) -> bool:
    """Validate that the issuer claim matches expected Clerk pattern."""
    if not issuer:
        return False
    # In development, allow any valid Clerk issuer (still requires https and clerk domain)
    if settings.is_development:
        # More permissive but still secure: must be HTTPS and contain 'clerk'
        return issuer.startswith("https://") and "clerk" in issuer.lower()
    return bool(CLERK_ISSUER_PATTERN.match(issuer))


async def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> str:
    """
    Verify the Clerk-issued JWT using the RS256 public key.
    Returns the user's Clerk ID (the 'sub' claim).
    """
    token = credentials.credentials
    public_key = _get_public_key()

    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={
                "verify_aud": False,  # Clerk JWTs don't always set 'aud'
                "verify_iss": True,
                "require_exp": True,
                "require_sub": True,
            },
        )
    except ExpiredSignatureError:
        security_logger.warning("Attempted access with expired token")
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError as e:
        # Log the error type but don't expose details to client
        security_logger.warning(f"JWT validation failed: {type(e).__name__}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    # Validate issuer claim
    issuer = payload.get("iss")
    if not _validate_issuer(issuer):
        security_logger.warning(f"JWT with invalid issuer: {issuer}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    user_id = payload.get("sub")
    if not user_id:
        security_logger.warning("JWT missing 'sub' claim")
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    # Validate user_id format (Clerk user IDs start with 'user_')
    if not isinstance(user_id, str) or not user_id.startswith("user_"):
        security_logger.warning(f"Invalid user_id format in JWT: {user_id[:20]}...")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    return user_id
