from functools import lru_cache
from dataclasses import dataclass

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

from app.core.config import settings
from app.db.session import get_session
from app.models.user import User
from app.services.user_sync import sync_user_from_jwt_payload
from app.services.organization_sync import sync_organization_from_jwt_payload

bearer = HTTPBearer(auto_error=True)


@dataclass(frozen=True)
class OrganizationContext:
    user_id: str
    organization_id: str
    organization_slug: str
    organization_role: str


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


def get_current_user(
    payload: dict = Depends(verify_clerk_token),
    session: Session = Depends(get_session),
) -> User:
    return sync_user_from_jwt_payload(payload, session)


def get_current_user_id(
    payload: dict = Depends(verify_clerk_token),
    session: Session = Depends(get_session),
) -> str:
    user = sync_user_from_jwt_payload(payload, session)
    return user.clerk_id


def get_organization_context(
    payload: dict = Depends(verify_clerk_token),
    session: Session = Depends(get_session),
) -> OrganizationContext:
    user = sync_user_from_jwt_payload(payload, session)
    organization = sync_organization_from_jwt_payload(payload, session)
    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Select an organization to access workspace data",
        )

    organization_claim = payload.get("o") if isinstance(payload.get("o"), dict) else {}
    role = str(organization_claim.get("rol") or payload.get("org_role") or "member")
    if role.startswith("org:"):
        role = role.removeprefix("org:")

    return OrganizationContext(
        user_id=user.clerk_id,
        organization_id=organization.clerk_id,
        organization_slug=organization.slug,
        organization_role=role,
    )


def require_paid_organization_plan(
    payload: dict = Depends(verify_clerk_token),
) -> dict:
    if not has_paid_organization_plan(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A paid organization plan is required to create additional teams",
        )
    return payload


def has_paid_organization_plan(payload: dict) -> bool:
    plans = payload.get("pla")
    if not isinstance(plans, str):
        return False

    for plan in plans.split(","):
        scope, separator, slug = plan.strip().partition(":")
        if separator and scope == "o" and slug and slug.lower() != "free":
            return True

    return False
