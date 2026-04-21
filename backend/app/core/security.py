from collections.abc import Callable
from functools import lru_cache

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

bearer = HTTPBearer(auto_error=True)


@lru_cache(maxsize=1)
def _fetch_jwks() -> dict:
    response = httpx.get(settings.clerk_jwks_url, timeout=10)
    response.raise_for_status()
    return response.json()


def _resolve_signing_key(token: str) -> str:
    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    if not kid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token key id")

    for jwk in _fetch_jwks().get("keys", []):
        if jwk.get("kid") == kid:
            return jwt.algorithms.RSAAlgorithm.from_jwk(jwk)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown signing key")


def verify_clerk_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    token = credentials.credentials
    key = _resolve_signing_key(token)

    kwargs: dict = {
        "algorithms": ["RS256"],
        "issuer": settings.clerk_issuer,
        "options": {"verify_aud": bool(settings.clerk_audience)},
    }

    if settings.clerk_audience:
        kwargs["audience"] = settings.clerk_audience

    try:
        payload = jwt.decode(token, key=key, **kwargs)
        return payload
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


def get_current_user_id(payload: dict = Depends(verify_clerk_token)) -> str:
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
    return str(sub)
