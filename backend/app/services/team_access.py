from fastapi import HTTPException, status
from sqlalchemy import case
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.security import OrganizationContext
from app.models.team import Team, TeamMembership


def require_team_member(
    team_id: int,
    context: OrganizationContext,
    session: Session,
) -> tuple[Team, str]:
    row = session.exec(
        select(Team, TeamMembership.role)
        .join(TeamMembership, TeamMembership.team_id == Team.id)
        .where(
            Team.id == team_id,
            Team.organization_id == context.organization_id,
            TeamMembership.user_id == context.user_id,
        )
    ).first()
    if row is None:
        raise LookupError("Team not found")
    return row


def ensure_default_team_membership(
    context: OrganizationContext,
    session: Session,
) -> Team:
    """Return the user's General team, or their first team if General is unavailable."""
    existing_team = session.exec(
        select(Team)
        .join(TeamMembership, TeamMembership.team_id == Team.id)
        .where(
            Team.organization_id == context.organization_id,
            TeamMembership.user_id == context.user_id,
        )
        .order_by(
            case((Team.key == "GENERAL", 0), else_=1),
            Team.id,
        )
    ).first()
    if existing_team is not None:
        return existing_team

    team = session.exec(
        select(Team).where(
            Team.organization_id == context.organization_id,
            Team.key == "GENERAL",
        )
    ).first()
    if team is None:
        team = Team(
            organization_id=context.organization_id,
            name="General",
            key="GENERAL",
            color="#5E6AD2",
            created_by=context.user_id,
        )
        session.add(team)
        try:
            session.flush()
        except IntegrityError:
            session.rollback()
            team = session.exec(
                select(Team).where(
                    Team.organization_id == context.organization_id,
                    Team.key == "GENERAL",
                )
            ).one()

    session.add(
        TeamMembership(
            team_id=team.id,
            user_id=context.user_id,
            role="admin" if team.created_by == context.user_id else "member",
        )
    )
    try:
        session.commit()
    except IntegrityError:
        session.rollback()

    return team


def resolve_storage_team(
    team_id: int | None,
    context: OrganizationContext,
    session: Session,
) -> Team:
    if team_id is None:
        return ensure_default_team_membership(context, session)

    try:
        team, _role = require_team_member(team_id, context, session)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found") from exc
    return team
