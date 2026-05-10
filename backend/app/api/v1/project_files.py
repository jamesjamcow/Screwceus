from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.core.security import get_current_user_id
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

router = APIRouter()

# ---------------------------------------------------------------------------
# Project files
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[ProjectFileRead])
def list_project_files(
    folder_id: int | None = Query(default=None),
    root_only: bool = Query(default=False),
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> list[ProjectFile]:
    statement = select(ProjectFile).where(ProjectFile.owner_id == user_id)
    if folder_id is not None:
        statement = statement.where(ProjectFile.folder_id == folder_id)
    elif root_only:
        statement = statement.where(ProjectFile.folder_id.is_(None))
    statement = statement.order_by(ProjectFile.updated_at.desc())
    return list(session.exec(statement))


@router.get("/{project_id}", response_model=ProjectFileRead)
def get_project_file(
    project_id: int,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> ProjectFile:
    project = session.get(ProjectFile, project_id)
    if not project or project.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("/", response_model=ProjectFileRead, status_code=status.HTTP_201_CREATED)
def create_project_file(
    payload: ProjectFileCreate,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> ProjectFile:
    if payload.folder_id is not None:
        folder = session.get(Folder, payload.folder_id)
        if not folder or folder.owner_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    project = ProjectFile(
        owner_id=user_id,
        folder_id=payload.folder_id,
        name=payload.name,
        description=payload.description,
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.patch("/{project_id}", response_model=ProjectFileRead)
def update_project_file(
    project_id: int,
    payload: ProjectFileUpdate,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> ProjectFile:
    project = session.get(ProjectFile, project_id)
    if not project or project.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if payload.folder_id is not None:
        folder = session.get(Folder, payload.folder_id)
        if not folder or folder.owner_id != user_id:
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
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> None:
    project = session.get(ProjectFile, project_id)
    if not project or project.owner_id != user_id:
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
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> list[ProjectScreenshot]:
    _require_project(project_id, user_id, session)
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
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> ProjectScreenshot:
    _require_project(project_id, user_id, session)

    photo = session.get(Photo, payload.photo_id)
    if not photo or photo.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    screenshot = ProjectScreenshot(
        project_file_id=project_id,
        photo_id=payload.photo_id,
        owner_id=user_id,
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
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> None:
    _require_project(project_id, user_id, session)
    screenshot = session.get(ProjectScreenshot, screenshot_id)
    if not screenshot or screenshot.project_file_id != project_id or screenshot.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Screenshot not found")
    session.delete(screenshot)
    session.commit()


# ---------------------------------------------------------------------------
# Parts linked to a project file
# ---------------------------------------------------------------------------


@router.get("/{project_id}/parts", response_model=list[ProjectPartRead])
def list_project_parts(
    project_id: int,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> list[ProjectPart]:
    _require_project(project_id, user_id, session)
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
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> ProjectPart:
    _require_project(project_id, user_id, session)

    part = session.get(Part, payload.part_id)
    if not part or part.owner_id != user_id:
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
        owner_id=user_id,
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
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> ProjectPart:
    _require_project(project_id, user_id, session)
    link = session.get(ProjectPart, link_id)
    if not link or link.project_file_id != project_id or link.owner_id != user_id:
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
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> None:
    _require_project(project_id, user_id, session)
    link = session.get(ProjectPart, link_id)
    if not link or link.project_file_id != project_id or link.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project-part link not found")
    session.delete(link)
    session.commit()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _require_project(project_id: int, user_id: str, session: Session) -> ProjectFile:
    project = session.get(ProjectFile, project_id)
    if not project or project.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project
