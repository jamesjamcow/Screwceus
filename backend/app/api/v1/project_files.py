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
from app.models.project_part import ProjectPart
from app.models.project_screenshot import ProjectScreenshot
from app.schemas.project_file import (
    ProjectFileCreate,
    ProjectFileRead,
    ProjectFileUpdate,
    ProjectPartAdd,
    ProjectPartRead,
    ProjectPartUpdate,
    ProjectScreenshotCreate,
    ProjectScreenshotRead,
)
from app.services.uploadthing import upload_file_to_uploadthing

router = APIRouter()

ALLOWED_MODEL_EXTENSIONS = {".glb", ".gltf", ".gib"}
ALLOWED_MODEL_TYPES = {
    "application/json",
    "application/octet-stream",
    "model/gltf-binary",
    "model/gltf+json",
}

# ---------------------------------------------------------------------------
# Project files
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[ProjectFileRead])
def list_project_files(
    folder_id: int | None = Query(default=None),
    root_only: bool = Query(default=False),
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> list[ProjectFile]:
    statement = select(ProjectFile).where(ProjectFile.organization_id == context.organization_id)
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
    return project


@router.post("/", response_model=ProjectFileRead, status_code=status.HTTP_201_CREATED)
def create_project_file(
    payload: ProjectFileCreate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> ProjectFile:
    if payload.folder_id is not None:
        folder = session.get(Folder, payload.folder_id)
        if not folder or folder.organization_id != context.organization_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    project = ProjectFile(
        owner_id=context.user_id,
        organization_id=context.organization_id,
        folder_id=payload.folder_id,
        name=payload.name,
        description=payload.description,
        model_url="",
        model_filename="",
        model_file_key="",
    )
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
    project = _require_project(project_id, context.organization_id, session)

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

    if payload.folder_id is not None:
        folder = session.get(Folder, payload.folder_id)
        if not folder or folder.organization_id != context.organization_id:
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

    # Remove linked screenshots and parts
    for screenshot in session.exec(
        select(ProjectScreenshot).where(ProjectScreenshot.project_file_id == project_id)
    ).all():
        session.delete(screenshot)
    for link in session.exec(
        select(ProjectPart).where(ProjectPart.project_file_id == project_id)
    ).all():
        session.delete(link)

    session.delete(project)
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
    _require_project(project_id, context.organization_id, session)
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
    _require_project(project_id, context.organization_id, session)

    photo = session.get(Photo, payload.photo_id)
    if not photo or photo.organization_id != context.organization_id:
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
    _require_project(project_id, context.organization_id, session)
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
) -> list[ProjectPart]:
    _require_project(project_id, context.organization_id, session)
    statement = (
        select(ProjectPart)
        .where(ProjectPart.project_file_id == project_id)
        .order_by(ProjectPart.created_at)
    )
    return list(session.exec(statement))


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
) -> ProjectPart:
    _require_project(project_id, context.organization_id, session)

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
    return link


@router.patch("/{project_id}/parts/{link_id}", response_model=ProjectPartRead)
def update_project_part(
    project_id: int,
    link_id: int,
    payload: ProjectPartUpdate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> ProjectPart:
    _require_project(project_id, context.organization_id, session)
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
    return link


@router.delete("/{project_id}/parts/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_part_from_project(
    project_id: int,
    link_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> None:
    _require_project(project_id, context.organization_id, session)
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


def _require_project(project_id: int, organization_id: str, session: Session) -> ProjectFile:
    project = session.get(ProjectFile, project_id)
    if not project or project.organization_id != organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project
