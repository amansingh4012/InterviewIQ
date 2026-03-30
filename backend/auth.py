from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from config import settings
import json
import base64

security = HTTPBearer()


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
            },
        )
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing 'sub' claim")

    return user_id
