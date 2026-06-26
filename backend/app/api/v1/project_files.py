from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlmodel import Session, select

from app.core.config import settings
from app.core.security import OrganizationContext, get_organization_context
from app.db.session import get_session
from app.models.folder import Folder
from app.models.part import Part
from app.models.photo import Photo
from app.models.project_file import ProjectFile
from app.models.project_issue import ProjectIssue
from app.models.project_part import ProjectPart
from app.models.project_screenshot import ProjectScreenshot
from app.schemas.project_file import (
    ProjectFileCreate,
    ProjectFileRead,
    ProjectFileUpdate,
    ProjectIssueCreate,
    ProjectIssueRead,
    ProjectIssueUpdate,
    ProjectPartAdd,
    ProjectPartRead,
    ProjectPartUpdate,
    ProjectScreenshotCreate,
    ProjectScreenshotRead,
)
from app.services.uploadthing import upload_file_to_uploadthing
from app.services.team_access import require_team_member, resolve_storage_team

router = APIRouter()

ALLOWED_MODEL_EXTENSIONS = {".glb", ".gltf", ".gib"}
ALLOWED_MODEL_TYPES = {
    "application/json",
    "application/octet-stream",
    "model/gltf-binary",
    "model/gltf+json",
}
ALLOWED_COVER_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
}

# ---------------------------------------------------------------------------
# Project files
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[ProjectFileRead])
def list_project_files(
    folder_id: int | None = Query(default=None),
    root_only: bool = Query(default=False),
    team_id: int | None = Query(default=None, gt=0),
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> list[ProjectFile]:
    team = resolve_storage_team(team_id, context, session)
    statement = select(ProjectFile).where(
        ProjectFile.organization_id == context.organization_id,
        ProjectFile.team_id == team.id,
    )
    if folder_id is not None:
        statement = statement.where(ProjectFile.folder_id == folder_id)
    elif root_only:
        statement = statement.where(ProjectFile.folder_id.is_(None))
    statement = statement.order_by(ProjectFile.updated_at.desc())
    return list(session.exec(statement))


@router.get("/{project_id}", response_model=ProjectFileRead)
def get_project_file(
    project_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> ProjectFile:
    project = session.get(ProjectFile, project_id)
    if not project or project.organization_id != context.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    _require_project_team(project, context, session)
    return project


@router.post("/", response_model=ProjectFileRead, status_code=status.HTTP_201_CREATED)
def create_project_file(
    payload: ProjectFileCreate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> ProjectFile:
    team = resolve_storage_team(payload.team_id, context, session)
    if payload.folder_id is not None:
        folder = session.get(Folder, payload.folder_id)
        if (
            not folder
            or folder.organization_id != context.organization_id
            or folder.team_id != team.id
        ):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    project = ProjectFile(
        owner_id=context.user_id,
        organization_id=context.organization_id,
        team_id=team.id,
        folder_id=payload.folder_id,
        name=payload.name,
        description=payload.description or "",
        status=payload.status or "planned",
        due_date=payload.due_date,
        cover_image_url="",
        cover_image_filename="",
        cover_image_file_key="",
        model_url="",
        model_filename="",
        model_file_key="",
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.post("/{project_id}/cover", response_model=ProjectFileRead)
async def upload_project_cover(
    project_id: int,
    file: UploadFile = File(...),
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> ProjectFile:
    project = _require_project(project_id, context, session)

    content_type = file.content_type or ""
    extension = ALLOWED_COVER_TYPES.get(content_type)
    if extension is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported cover image type")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty upload")
    if len(contents) > settings.max_image_upload_bytes:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Cover image is too large")

    original_name = file.filename or "project-cover"
    filename = original_name if Path(original_name).suffix else f"{original_name}{extension}"
    uploaded_file = await upload_file_to_uploadthing(
        content=contents,
        filename=filename,
        content_type=content_type,
    )

    project.cover_image_url = uploaded_file.url
    project.cover_image_filename = uploaded_file.name
    project.cover_image_file_key = uploaded_file.key
    project.updated_at = datetime.utcnow()
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.post("/{project_id}/model", response_model=ProjectFileRead)
async def upload_project_model(
    project_id: int,
    file: UploadFile = File(...),
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> ProjectFile:
    project = _require_project(project_id, context, session)

    extension = Path(file.filename or "").suffix.lower()
    content_type = file.content_type or "application/octet-stream"
    if extension not in ALLOWED_MODEL_EXTENSIONS or content_type not in ALLOWED_MODEL_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported 3D model type")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty upload")

    if len(contents) > settings.max_model_upload_bytes:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="3D model is too large")

    filename = file.filename or f"project-model{extension or '.glb'}"
    uploaded_file = await upload_file_to_uploadthing(
        content=contents,
        filename=filename,
        content_type=content_type,
    )

    project.model_url = uploaded_file.url
    project.model_filename = uploaded_file.name
    project.model_file_key = uploaded_file.key
    project.updated_at = datetime.utcnow()

    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.patch("/{project_id}", response_model=ProjectFileRead)
def update_project_file(
    project_id: int,
    payload: ProjectFileUpdate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> ProjectFile:
    project = session.get(ProjectFile, project_id)
    if not project or project.organization_id != context.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    _require_project_team(project, context, session)

    if payload.folder_id is not None:
        folder = session.get(Folder, payload.folder_id)
        if (
            not folder
            or folder.organization_id != context.organization_id
            or folder.team_id != project.team_id
        ):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
    project.updated_at = datetime.utcnow()

    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_file(
    project_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> None:
    project = session.get(ProjectFile, project_id)
    if not project or project.organization_id != context.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    _require_project_team(project, context, session)

    # Remove records attached to this project before deleting it.
    for screenshot in session.exec(
        select(ProjectScreenshot).where(ProjectScreenshot.project_file_id == project_id)
    ).all():
        session.delete(screenshot)
    for link in session.exec(
        select(ProjectPart).where(ProjectPart.project_file_id == project_id)
    ).all():
        session.delete(link)
    for issue in session.exec(
        select(ProjectIssue).where(ProjectIssue.project_file_id == project_id)
    ).all():
        session.delete(issue)

    session.delete(project)
    session.commit()


# ---------------------------------------------------------------------------
# Issues attached to a project file
# ---------------------------------------------------------------------------


@router.get("/{project_id}/issues", response_model=list[ProjectIssueRead])
def list_project_issues(
    project_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> list[ProjectIssue]:
    _require_project(project_id, context, session)
    statement = (
        select(ProjectIssue)
        .where(
            ProjectIssue.project_file_id == project_id,
            ProjectIssue.organization_id == context.organization_id,
        )
        .order_by(ProjectIssue.created_at.desc())
    )
    return list(session.exec(statement))


@router.post(
    "/{project_id}/issues",
    response_model=ProjectIssueRead,
    status_code=status.HTTP_201_CREATED,
)
def create_project_issue(
    project_id: int,
    payload: ProjectIssueCreate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> ProjectIssue:
    _require_project(project_id, context, session)
    issue = ProjectIssue(
        project_file_id=project_id,
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


@router.patch("/{project_id}/issues/{issue_id}", response_model=ProjectIssueRead)
def update_project_issue(
    project_id: int,
    issue_id: int,
    payload: ProjectIssueUpdate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> ProjectIssue:
    _require_project(project_id, context, session)
    issue = _require_project_issue(issue_id, project_id, context.organization_id, session)

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(issue, key, value)
    issue.updated_at = datetime.utcnow()
    session.add(issue)
    session.commit()
    session.refresh(issue)
    return issue


@router.delete("/{project_id}/issues/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_issue(
    project_id: int,
    issue_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> None:
    _require_project(project_id, context, session)
    issue = _require_project_issue(issue_id, project_id, context.organization_id, session)
    session.delete(issue)
    session.commit()


# ---------------------------------------------------------------------------
# Screenshots on a project file
# ---------------------------------------------------------------------------


@router.get("/{project_id}/screenshots", response_model=list[ProjectScreenshotRead])
def list_screenshots(
    project_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> list[ProjectScreenshot]:
    _require_project(project_id, context, session)
    statement = (
        select(ProjectScreenshot)
        .where(ProjectScreenshot.project_file_id == project_id)
        .order_by(ProjectScreenshot.sort_order, ProjectScreenshot.created_at)
    )
    return list(session.exec(statement))


@router.post(
    "/{project_id}/screenshots",
    response_model=ProjectScreenshotRead,
    status_code=status.HTTP_201_CREATED,
)
def add_screenshot(
    project_id: int,
    payload: ProjectScreenshotCreate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> ProjectScreenshot:
    project = _require_project(project_id, context, session)

    photo = session.get(Photo, payload.photo_id)
    if (
        not photo
        or photo.organization_id != context.organization_id
        or photo.team_id != project.team_id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    screenshot = ProjectScreenshot(
        project_file_id=project_id,
        photo_id=payload.photo_id,
        owner_id=context.user_id,
        organization_id=context.organization_id,
        caption=payload.caption,
        sort_order=payload.sort_order,
    )
    session.add(screenshot)
    session.commit()
    session.refresh(screenshot)
    return screenshot


@router.delete("/{project_id}/screenshots/{screenshot_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_screenshot(
    project_id: int,
    screenshot_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> None:
    _require_project(project_id, context, session)
    screenshot = session.get(ProjectScreenshot, screenshot_id)
    if (
        not screenshot
        or screenshot.project_file_id != project_id
        or screenshot.organization_id != context.organization_id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Screenshot not found")
    session.delete(screenshot)
    session.commit()


# ---------------------------------------------------------------------------
# Parts linked to a project file
# ---------------------------------------------------------------------------


@router.get("/{project_id}/parts", response_model=list[ProjectPartRead])
def list_project_parts(
    project_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> list[dict]:
    _require_project(project_id, context, session)
    statement = (
        select(ProjectPart, Part)
        .join(Part, ProjectPart.part_id == Part.id)
        .where(ProjectPart.project_file_id == project_id)
        .order_by(ProjectPart.created_at)
    )
    return [_project_part_payload(link, part) for link, part in session.exec(statement)]


@router.post(
    "/{project_id}/parts",
    response_model=ProjectPartRead,
    status_code=status.HTTP_201_CREATED,
)
def add_part_to_project(
    project_id: int,
    payload: ProjectPartAdd,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> dict:
    _require_project(project_id, context, session)

    part = session.get(Part, payload.part_id)
    if not part or part.organization_id != context.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Part not found")

    existing = session.exec(
        select(ProjectPart).where(
            ProjectPart.project_file_id == project_id,
            ProjectPart.part_id == payload.part_id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Part already linked to this project")

    link = ProjectPart(
        project_file_id=project_id,
        part_id=payload.part_id,
        owner_id=context.user_id,
        organization_id=context.organization_id,
        point=payload.point,
        notes=payload.notes,
    )
    session.add(link)
    session.commit()
    session.refresh(link)
    return _project_part_payload(link, part)


@router.patch("/{project_id}/parts/{link_id}", response_model=ProjectPartRead)
def update_project_part(
    project_id: int,
    link_id: int,
    payload: ProjectPartUpdate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> dict:
    _require_project(project_id, context, session)
    link = session.get(ProjectPart, link_id)
    if (
        not link
        or link.project_file_id != project_id
        or link.organization_id != context.organization_id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project-part link not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(link, key, value)

    session.add(link)
    session.commit()
    session.refresh(link)
    part = session.get(Part, link.part_id)
    if not part or part.organization_id != context.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Part not found")
    return _project_part_payload(link, part)


@router.delete("/{project_id}/parts/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_part_from_project(
    project_id: int,
    link_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> None:
    _require_project(project_id, context, session)
    link = session.get(ProjectPart, link_id)
    if (
        not link
        or link.project_file_id != project_id
        or link.organization_id != context.organization_id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project-part link not found")
    session.delete(link)
    session.commit()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _require_project(
    project_id: int,
    context: OrganizationContext,
    session: Session,
) -> ProjectFile:
    project = session.get(ProjectFile, project_id)
    if not project or project.organization_id != context.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    _require_project_team(project, context, session)
    return project


def _project_part_payload(link: ProjectPart, part: Part) -> dict:
    return {
        "id": link.id,
        "project_file_id": link.project_file_id,
        "part_id": link.part_id,
        "owner_id": link.owner_id,
        "organization_id": link.organization_id,
        "point": link.point,
        "notes": link.notes,
        "created_at": link.created_at,
        "part": part,
    }


def _require_project_team(
    project: ProjectFile,
    context: OrganizationContext,
    session: Session,
) -> None:
    try:
        require_team_member(project.team_id, context, session)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found") from exc


def _require_project_issue(
    issue_id: int,
    project_id: int,
    organization_id: str,
    session: Session,
) -> ProjectIssue:
    issue = session.get(ProjectIssue, issue_id)
    if (
        not issue
        or issue.project_file_id != project_id
        or issue.organization_id != organization_id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue
