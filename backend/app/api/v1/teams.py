from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.security import OrganizationContext, get_organization_context
from app.db.session import get_session
from app.models.team import Team, TeamMembership
from app.schemas.team import TeamCreate, TeamRead

router = APIRouter()


@router.get("/", response_model=list[TeamRead])
def list_teams(
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> list[TeamRead]:
    _ensure_general_team_membership(context, session)
    rows = session.exec(
        select(Team, TeamMembership.role)
        .join(TeamMembership, TeamMembership.team_id == Team.id)
        .where(
            Team.organization_id == context.organization_id,
            TeamMembership.user_id == context.user_id,
        )
        .order_by(Team.name)
    ).all()
    return [
        TeamRead.model_validate(team).model_copy(update={"role": role})
        for team, role in rows
    ]


@router.post("/", response_model=TeamRead, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: TeamCreate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> TeamRead:
    team = Team(
        organization_id=context.organization_id,
        name=payload.name,
        key=payload.key.upper(),
        color=payload.color.upper(),
        created_by=context.user_id,
    )
    session.add(team)
    try:
        session.flush()
        session.add(
            TeamMembership(
                team_id=team.id,
                user_id=context.user_id,
                role="admin",
            )
        )
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A team with key '{payload.key.upper()}' already exists",
        ) from exc

    session.refresh(team)
    return TeamRead.model_validate(team).model_copy(update={"role": "admin"})


def _ensure_general_team_membership(context: OrganizationContext, session: Session) -> None:
    existing_membership = session.exec(
        select(TeamMembership)
        .join(Team, Team.id == TeamMembership.team_id)
        .where(
            Team.organization_id == context.organization_id,
            TeamMembership.user_id == context.user_id,
        )
    ).first()
    if existing_membership:
        return

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
