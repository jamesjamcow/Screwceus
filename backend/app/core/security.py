from datetime import datetime
from functools import lru_cache

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

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


def _build_get_current_user():
    """Factory that avoids circular imports at module level."""
    from app.db.session import get_session
    from app.models.user import User

    def _inner(
        payload: dict = Depends(verify_clerk_token),
        session: Session = Depends(get_session),
    ) -> User:
        clerk_id = payload.get("sub", "")
        if not clerk_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

        user = session.exec(select(User).where(User.clerk_id == clerk_id)).first()

        # Extract profile fields Clerk puts in the JWT (if present)
        email = payload.get("email", "") or ""
        display_name = payload.get("name", "") or ""
        avatar_url = payload.get("image_url", "") or payload.get("picture", "") or ""

        if user is None:
            user = User(
                clerk_id=clerk_id,
                email=email,
                display_name=display_name,
                avatar_url=avatar_url,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        else:
            changed = False
            if email and user.email != email:
                user.email = email
                changed = True
            if display_name and user.display_name != display_name:
                user.display_name = display_name
                changed = True
            if avatar_url and user.avatar_url != avatar_url:
                user.avatar_url = avatar_url
                changed = True
            if changed:
                user.updated_at = datetime.utcnow()
                session.add(user)
                session.commit()
                session.refresh(user)

        return user

    return _inner


get_current_user = _build_get_current_user()
