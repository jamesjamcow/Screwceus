from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.security import (
    OrganizationContext,
    get_organization_context,
    require_paid_organization_plan,
)
from app.db.session import get_session
from app.models.folder import Folder
from app.models.photo import Photo
from app.models.project_file import ProjectFile
from app.models.project_issue import ProjectIssue
from app.models.project_part import ProjectPart
from app.models.project_screenshot import ProjectScreenshot
from app.models.team import Team, TeamIssue, TeamMembership, TeamResource
from app.models.user import User
from app.schemas.team import (
    TeamCreate,
    TeamIssueCreate,
    TeamIssueRead,
    TeamIssueUpdate,
    TeamRead,
    TeamResourceCreate,
    TeamResourceRead,
    TeamUpdate,
)
from app.services.clerk_organizations import ClerkOrganizationError, get_organization_members
from app.services.team_access import ensure_default_team_membership, require_team_member

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
    _paid_plan: dict = Depends(require_paid_organization_plan),
    session: Session = Depends(get_session),
) -> TeamRead:
    requested_member_ids = [
        user_id for user_id in payload.member_ids if user_id != context.user_id
    ]
    try:
        organization_members = get_organization_members(
            context.organization_id,
            requested_member_ids,
        )
    except ClerkOrganizationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    missing_members = sorted(set(requested_member_ids) - organization_members.keys())
    if missing_members:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Every selected team member must belong to the active Clerk organization",
        )

    for member in organization_members.values():
        user = session.exec(select(User).where(User.clerk_id == member.user_id)).first()
        if user is None:
            session.add(
                User(
                    clerk_id=member.user_id,
                    email=member.email,
                    display_name=member.display_name,
                    avatar_url=member.avatar_url,
                )
            )

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
        for member_id in requested_member_ids:
            session.add(
                TeamMembership(
                    team_id=team.id,
                    user_id=member_id,
                    role="member",
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


@router.patch("/{team_id}", response_model=TeamRead)
def update_team(
    team_id: int,
    payload: TeamUpdate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> TeamRead:
    team, role = _require_team_member(team_id, context, session)
    team.description = payload.description
    team.updated_at = datetime.utcnow()
    session.add(team)
    session.commit()
    session.refresh(team)
    return TeamRead.model_validate(team).model_copy(update={"role": role})


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> None:
    team, role = _require_team_member(team_id, context, session)
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team admins can delete a team",
        )
    if team.key == "GENERAL":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The default General team cannot be deleted",
        )

    project_ids = list(
        session.exec(
            select(ProjectFile.id).where(
                ProjectFile.team_id == team_id,
                ProjectFile.organization_id == context.organization_id,
            )
        )
    )
    photo_ids = list(
        session.exec(
            select(Photo.id).where(
                Photo.team_id == team_id,
                Photo.organization_id == context.organization_id,
            )
        )
    )

    screenshot_filters = []
    if project_ids:
        screenshot_filters.append(ProjectScreenshot.project_file_id.in_(project_ids))
    if photo_ids:
        screenshot_filters.append(ProjectScreenshot.photo_id.in_(photo_ids))
    if screenshot_filters:
        _delete_rows(
            session,
            select(ProjectScreenshot).where(
                ProjectScreenshot.organization_id == context.organization_id,
                or_(*screenshot_filters),
            ),
        )

    if project_ids:
        _delete_rows(
            session,
            select(ProjectPart).where(
                ProjectPart.organization_id == context.organization_id,
                ProjectPart.project_file_id.in_(project_ids),
            ),
        )
        _delete_rows(
            session,
            select(ProjectIssue).where(
                ProjectIssue.organization_id == context.organization_id,
                ProjectIssue.project_file_id.in_(project_ids),
            ),
        )

    _delete_rows(
        session,
        select(TeamIssue).where(
            TeamIssue.team_id == team_id,
            TeamIssue.organization_id == context.organization_id,
        ),
    )
    _delete_rows(session, select(TeamResource).where(TeamResource.team_id == team_id))
    _delete_rows(
        session,
        select(ProjectFile).where(
            ProjectFile.team_id == team_id,
            ProjectFile.organization_id == context.organization_id,
        ),
    )
    _delete_team_folders(session, context.organization_id, team_id)
    _delete_rows(
        session,
        select(Photo).where(
            Photo.team_id == team_id,
            Photo.organization_id == context.organization_id,
        ),
    )
    _delete_rows(session, select(TeamMembership).where(TeamMembership.team_id == team_id))
    # Ensure dependent rows are gone before the parent team delete hits FK checks.
    session.flush()
    session.delete(team)
    session.commit()


@router.get("/{team_id}/resources", response_model=list[TeamResourceRead])
def list_team_resources(
    team_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> list[TeamResource]:
    _require_team_member(team_id, context, session)
    return list(
        session.exec(
            select(TeamResource)
            .where(TeamResource.team_id == team_id)
            .order_by(TeamResource.created_at.desc())
        )
    )


@router.post(
    "/{team_id}/resources",
    response_model=TeamResourceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_team_resource(
    team_id: int,
    payload: TeamResourceCreate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> TeamResource:
    _require_team_member(team_id, context, session)
    resource = TeamResource(
        team_id=team_id,
        created_by=context.user_id,
        name=payload.name,
        description=payload.description,
        url=payload.url,
    )
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource


@router.get("/{team_id}/issues", response_model=list[TeamIssueRead])
def list_team_issues(
    team_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> list[TeamIssue]:
    _require_team_member(team_id, context, session)
    return list(
        session.exec(
            select(TeamIssue)
            .where(
                TeamIssue.team_id == team_id,
                TeamIssue.organization_id == context.organization_id,
            )
            .order_by(TeamIssue.updated_at.desc())
        )
    )


@router.post(
    "/{team_id}/issues",
    response_model=TeamIssueRead,
    status_code=status.HTTP_201_CREATED,
)
def create_team_issue(
    team_id: int,
    payload: TeamIssueCreate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> TeamIssue:
    _require_team_member(team_id, context, session)
    issue = TeamIssue(
        team_id=team_id,
        owner_id=context.user_id,
        organization_id=context.organization_id,
        issue=payload.issue,
        description=payload.description,
        author=payload.author,
        status=payload.status,
    )
    session.add(issue)
    session.commit()
    session.refresh(issue)
    return issue


@router.patch("/{team_id}/issues/{issue_id}", response_model=TeamIssueRead)
def update_team_issue(
    team_id: int,
    issue_id: int,
    payload: TeamIssueUpdate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> TeamIssue:
    _require_team_member(team_id, context, session)
    issue = _require_team_issue(issue_id, team_id, context.organization_id, session)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(issue, key, value)
    issue.updated_at = datetime.utcnow()
    session.add(issue)
    session.commit()
    session.refresh(issue)
    return issue


@router.delete("/{team_id}/issues/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team_issue(
    team_id: int,
    issue_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> None:
    _require_team_member(team_id, context, session)
    issue = _require_team_issue(issue_id, team_id, context.organization_id, session)
    session.delete(issue)
    session.commit()


def _require_team_member(
    team_id: int,
    context: OrganizationContext,
    session: Session,
) -> tuple[Team, str]:
    try:
        return require_team_member(team_id, context, session)
    except LookupError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")


def _require_team_issue(
    issue_id: int,
    team_id: int,
    organization_id: str,
    session: Session,
) -> TeamIssue:
    issue = session.get(TeamIssue, issue_id)
    if (
        not issue
        or issue.team_id != team_id
        or issue.organization_id != organization_id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


def _delete_rows(session: Session, statement) -> None:
    for row in session.exec(statement).all():
        session.delete(row)


def _delete_team_folders(session: Session, organization_id: str, team_id: int) -> None:
    folders = list(
        session.exec(
            select(Folder).where(
                Folder.team_id == team_id,
                Folder.organization_id == organization_id,
            )
        )
    )
    folder_lookup = {folder.id: folder for folder in folders if folder.id is not None}
    depth_cache: dict[int, int] = {}

    def depth(folder: Folder) -> int:
        if folder.id in depth_cache:
            return depth_cache[folder.id]
        parent = folder_lookup.get(folder.parent_id)
        value = depth(parent) + 1 if parent else 0
        depth_cache[folder.id] = value
        return value

    for folder in sorted(folders, key=depth, reverse=True):
        session.delete(folder)



def _ensure_general_team_membership(context: OrganizationContext, session: Session) -> None:
    ensure_default_team_membership(context, session)
