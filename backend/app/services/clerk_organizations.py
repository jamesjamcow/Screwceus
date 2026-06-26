from dataclasses import dataclass

import httpx

from app.core.config import settings


class ClerkOrganizationError(RuntimeError):
    pass


@dataclass(frozen=True)
class ClerkOrganizationMember:
    user_id: str
    email: str
    display_name: str
    avatar_url: str


def get_organization_members(
    organization_id: str,
    user_ids: list[str],
) -> dict[str, ClerkOrganizationMember]:
    if not user_ids:
        return {}
    if not settings.clerk_secret_key:
        raise ClerkOrganizationError("Clerk secret key is not configured")

    params: list[tuple[str, str]] = [("limit", str(len(user_ids)))]
    params.extend(("user_id", user_id) for user_id in user_ids)

    try:
        response = httpx.get(
            f"{settings.clerk_api_url.rstrip('/')}/organizations/{organization_id}/memberships",
            params=params,
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
            timeout=10,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise ClerkOrganizationError("Could not verify Clerk organization members") from exc

    members: dict[str, ClerkOrganizationMember] = {}
    for membership in response.json().get("data", []):
        public_user = membership.get("public_user_data") or {}
        user_id = str(public_user.get("user_id") or "")
        if not user_id:
            continue

        first_name = str(public_user.get("first_name") or "").strip()
        last_name = str(public_user.get("last_name") or "").strip()
        identifier = str(public_user.get("identifier") or "").strip()
        display_name = " ".join(part for part in (first_name, last_name) if part)
        members[user_id] = ClerkOrganizationMember(
            user_id=user_id,
            email=identifier if "@" in identifier else "",
            display_name=display_name or identifier,
            avatar_url=str(public_user.get("image_url") or ""),
        )

    return members
