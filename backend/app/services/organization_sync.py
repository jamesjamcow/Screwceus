from datetime import datetime

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.models.organization import Organization


def sync_organization_from_clerk_payload(payload: dict, session: Session) -> Organization | None:
    clerk_id = str(payload.get("id") or "")
    if not clerk_id:
        return None

    return _upsert_organization(
        session=session,
        clerk_id=clerk_id,
        name=str(payload.get("name") or payload.get("slug") or clerk_id),
        slug=str(payload.get("slug") or ""),
        image_url=str(payload.get("image_url") or ""),
    )


def sync_organization_from_jwt_payload(payload: dict, session: Session) -> Organization | None:
    organization_claim = payload.get("o") if isinstance(payload.get("o"), dict) else {}
    clerk_id = str(organization_claim.get("id") or payload.get("org_id") or "")
    if not clerk_id:
        return None

    slug = str(organization_claim.get("slg") or payload.get("org_slug") or "")
    fallback_name = slug.replace("-", " ").strip().title() or "Workspace"
    return _upsert_organization(
        session=session,
        clerk_id=clerk_id,
        name=fallback_name,
        slug=slug,
        image_url="",
        preserve_existing_profile=True,
    )


def _upsert_organization(
    *,
    session: Session,
    clerk_id: str,
    name: str,
    slug: str,
    image_url: str,
    preserve_existing_profile: bool = False,
) -> Organization:
    organization = session.exec(
        select(Organization).where(Organization.clerk_id == clerk_id)
    ).first()
    if organization is None:
        organization = Organization(
            clerk_id=clerk_id,
            name=name,
            slug=slug,
            image_url=image_url,
        )
        session.add(organization)
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            organization = session.exec(
                select(Organization).where(Organization.clerk_id == clerk_id)
            ).one()
        else:
            session.refresh(organization)
            return organization

    if preserve_existing_profile:
        if slug and organization.slug != slug:
            organization.slug = slug
            organization.updated_at = datetime.utcnow()
            session.add(organization)
            session.commit()
            session.refresh(organization)
        return organization

    changed = False
    for field, value in (("name", name), ("slug", slug), ("image_url", image_url)):
        if value and getattr(organization, field) != value:
            setattr(organization, field, value)
            changed = True

    if changed:
        organization.updated_at = datetime.utcnow()
        session.add(organization)
        session.commit()
        session.refresh(organization)

    return organization
