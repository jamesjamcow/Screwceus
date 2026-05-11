from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.models.user import User


def sync_user_from_clerk_payload(payload: dict, session: Session) -> User:
    clerk_id = str(payload.get("id") or "")
    if not clerk_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Clerk user id")

    email = _primary_email(payload)
    display_name = _display_name(payload, email)
    avatar_url = payload.get("image_url") or payload.get("profile_image_url") or ""

    return _upsert_user(
        session=session,
        clerk_id=clerk_id,
        email=email,
        display_name=display_name,
        avatar_url=avatar_url,
    )


def sync_user_from_jwt_payload(payload: dict, session: Session) -> User:
    clerk_id = str(payload.get("sub") or "")
    if not clerk_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    return _upsert_user(
        session=session,
        clerk_id=clerk_id,
        email=payload.get("email") or "",
        display_name=payload.get("name") or "",
        avatar_url=payload.get("image_url") or payload.get("picture") or "",
    )


def _upsert_user(
    *,
    session: Session,
    clerk_id: str,
    email: str,
    display_name: str,
    avatar_url: str,
) -> User:
    user = session.exec(select(User).where(User.clerk_id == clerk_id)).first()
    if user is None:
        user = User(
            clerk_id=clerk_id,
            email=email,
            display_name=display_name,
            avatar_url=avatar_url,
        )
        session.add(user)
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            user = session.exec(select(User).where(User.clerk_id == clerk_id)).first()
            if user is None:
                raise
            return _update_user_fields(session, user, email, display_name, avatar_url)

        session.refresh(user)
        return user

    return _update_user_fields(session, user, email, display_name, avatar_url)


def _update_user_fields(
    session: Session,
    user: User,
    email: str,
    display_name: str,
    avatar_url: str,
) -> User:
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


def _primary_email(payload: dict) -> str:
    emails = payload.get("email_addresses") or []
    primary_id = payload.get("primary_email_address_id")

    for email in emails:
        if email.get("id") == primary_id:
            return email.get("email_address") or ""

    if emails:
        return emails[0].get("email_address") or ""

    return ""


def _display_name(payload: dict, email: str) -> str:
    first_name = payload.get("first_name") or ""
    last_name = payload.get("last_name") or ""
    name = " ".join(part for part in (first_name.strip(), last_name.strip()) if part)
    if name:
        return name

    username = payload.get("username") or ""
    if username:
        return username

    if email and "@" in email:
        return email.split("@", 1)[0]

    return ""
