from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, or_
from sqlmodel import Session, select

from app.core.security import OrganizationContext, get_organization_context
from app.db.session import get_session
from app.models.project_file import ProjectFile
from app.models.project_issue import ProjectIssue
from app.models.team import Team, TeamIssue, TeamMembership
from app.schemas.search import WorkspaceSearchResponse, WorkspaceSearchResult

router = APIRouter()


@router.get("/", response_model=WorkspaceSearchResponse)
def search_workspace(
    q: str = Query(min_length=2, max_length=100),
    limit: int = Query(default=12, ge=1, le=30),
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> WorkspaceSearchResponse:
    query = q.strip()
    if len(query) < 2:
        # Preserve the same validation contract after trimming whitespace.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Search query must contain at least 2 non-whitespace characters",
        )

    contains_pattern = f"%{_escape_like(query)}%"
    prefix_pattern = f"{_escape_like(query)}%"
    exact_pattern = _escape_like(query)
    candidate_limit = min(limit * 2, 60)

    project_rank = case(
        (ProjectFile.name.ilike(exact_pattern, escape="\\"), 0),
        (ProjectFile.name.ilike(prefix_pattern, escape="\\"), 1),
        else_=2,
    )
    project_rows = session.exec(
        select(ProjectFile, Team)
        .join(Team, Team.id == ProjectFile.team_id)
        .join(TeamMembership, TeamMembership.team_id == Team.id)
        .where(
            ProjectFile.organization_id == context.organization_id,
            Team.organization_id == context.organization_id,
            TeamMembership.user_id == context.user_id,
            or_(
                ProjectFile.name.ilike(contains_pattern, escape="\\"),
                ProjectFile.description.ilike(contains_pattern, escape="\\"),
            ),
        )
        .order_by(project_rank, ProjectFile.updated_at.desc())
        .limit(candidate_limit)
    ).all()

    issue_rank = case(
        (ProjectIssue.issue.ilike(exact_pattern, escape="\\"), 0),
        (ProjectIssue.issue.ilike(prefix_pattern, escape="\\"), 1),
        else_=2,
    )
    issue_rows = session.exec(
        select(ProjectIssue, ProjectFile, Team)
        .join(ProjectFile, ProjectFile.id == ProjectIssue.project_file_id)
        .join(Team, Team.id == ProjectFile.team_id)
        .join(TeamMembership, TeamMembership.team_id == Team.id)
        .where(
            ProjectIssue.organization_id == context.organization_id,
            ProjectFile.organization_id == context.organization_id,
            Team.organization_id == context.organization_id,
            TeamMembership.user_id == context.user_id,
            or_(
                ProjectIssue.issue.ilike(contains_pattern, escape="\\"),
                ProjectIssue.description.ilike(contains_pattern, escape="\\"),
            ),
        )
        .order_by(issue_rank, ProjectIssue.updated_at.desc())
        .limit(candidate_limit)
    ).all()

    team_issue_rank = case(
        (TeamIssue.issue.ilike(exact_pattern, escape="\\"), 0),
        (TeamIssue.issue.ilike(prefix_pattern, escape="\\"), 1),
        else_=2,
    )
    team_issue_rows = session.exec(
        select(TeamIssue, Team)
        .join(Team, Team.id == TeamIssue.team_id)
        .join(TeamMembership, TeamMembership.team_id == Team.id)
        .where(
            TeamIssue.organization_id == context.organization_id,
            Team.organization_id == context.organization_id,
            TeamMembership.user_id == context.user_id,
            or_(
                TeamIssue.issue.ilike(contains_pattern, escape="\\"),
                TeamIssue.description.ilike(contains_pattern, escape="\\"),
            ),
        )
        .order_by(team_issue_rank, TeamIssue.updated_at.desc())
        .limit(candidate_limit)
    ).all()

    ranked_results: list[tuple[int, float, int, WorkspaceSearchResult]] = []
    for project, team in project_rows:
        ranked_results.append(
            (
                _text_rank(query, project.name, project.description),
                -_timestamp(project.updated_at),
                0,
                WorkspaceSearchResult(
                    type="project",
                    id=project.id,
                    title=project.name,
                    description=project.description,
                    status=project.status,
                    project_id=project.id,
                    project_name=project.name,
                    team_id=team.id,
                    team_name=team.name,
                    updated_at=project.updated_at,
                ),
            )
        )

    for issue, project, team in issue_rows:
        ranked_results.append(
            (
                _text_rank(query, issue.issue, issue.description),
                -_timestamp(issue.updated_at),
                1,
                WorkspaceSearchResult(
                    type="issue",
                    issue_scope="project",
                    id=issue.id,
                    title=issue.issue,
                    description=issue.description,
                    status=issue.status,
                    project_id=project.id,
                    project_name=project.name,
                    team_id=team.id,
                    team_name=team.name,
                    updated_at=issue.updated_at,
                ),
            )
        )

    for issue, team in team_issue_rows:
        ranked_results.append(
            (
                _text_rank(query, issue.issue, issue.description),
                -_timestamp(issue.updated_at),
                1,
                WorkspaceSearchResult(
                    type="issue",
                    issue_scope="team",
                    id=issue.id,
                    title=issue.issue,
                    description=issue.description,
                    status=issue.status,
                    project_name="",
                    team_id=team.id,
                    team_name=team.name,
                    updated_at=issue.updated_at,
                ),
            )
        )

    ranked_results.sort(key=lambda item: item[:3])
    return WorkspaceSearchResponse(
        query=query,
        results=[item[3] for item in ranked_results[:limit]],
    )


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _text_rank(query: str, title: str, description: str) -> int:
    normalized_query = query.casefold()
    normalized_title = title.casefold()
    if normalized_title == normalized_query:
        return 0
    if normalized_title.startswith(normalized_query):
        return 1
    if normalized_query in normalized_title:
        return 2
    if normalized_query in description.casefold():
        return 3
    return 4


def _timestamp(value: datetime) -> float:
    return value.timestamp()
