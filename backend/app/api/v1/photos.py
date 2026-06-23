from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import Session, select

from app.core.config import settings
from app.core.security import OrganizationContext, get_organization_context
from app.db.session import get_session
from app.models.photo import Photo
from app.models.project_file import ProjectFile
from app.models.project_screenshot import ProjectScreenshot
from app.schemas.photo import PhotoCreate, PhotoRead, PhotoUploadRead
from app.services.uploadthing import upload_file_to_uploadthing

router = APIRouter()

ALLOWED_IMAGE_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


@router.get("/", response_model=list[PhotoRead])
def list_photos(
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> list[Photo]:
    statement = (
        select(Photo)
        .where(Photo.organization_id == context.organization_id)
        .order_by(Photo.created_at.desc())
    )
    return list(session.exec(statement))


@router.post("/", response_model=PhotoRead)
def create_photo(
    payload: PhotoCreate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> Photo:
    photo = Photo(
        owner_id=context.user_id,
        organization_id=context.organization_id,
        title=payload.title,
        image_url=payload.image_url,
        annotation_json=payload.annotation_json,
    )
    session.add(photo)
    session.commit()
    session.refresh(photo)
    return photo


@router.post("/upload", response_model=PhotoUploadRead, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
    project_id: int | None = Form(default=None),
    caption: str = Form(default=""),
    sort_order: int = Form(default=0),
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> PhotoUploadRead:
    content_type = file.content_type or ""
    extension = ALLOWED_IMAGE_TYPES.get(content_type)
    if extension is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image type")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty upload")

    if len(contents) > settings.max_image_upload_bytes:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Image is too large")

    project: ProjectFile | None = None
    if project_id is not None:
        project = session.get(ProjectFile, project_id)
        if not project or project.organization_id != context.organization_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    filename = _image_filename(file.filename, extension)
    uploaded_file = await upload_file_to_uploadthing(
        content=contents,
        filename=filename,
        content_type=content_type,
    )

    photo = Photo(
        owner_id=context.user_id,
        organization_id=context.organization_id,
        title=title or file.filename or "Uploaded image",
        image_url=uploaded_file.url,
        annotation_json=None,
    )
    session.add(photo)
    session.flush()

    screenshot: ProjectScreenshot | None = None
    if project is not None:
        screenshot = ProjectScreenshot(
            project_file_id=project.id,
            photo_id=photo.id,
            owner_id=context.user_id,
            organization_id=context.organization_id,
            caption=caption,
            sort_order=sort_order,
        )
        session.add(screenshot)

    session.commit()
    session.refresh(photo)
    if screenshot is not None:
        session.refresh(screenshot)

    return PhotoUploadRead(photo=photo, screenshot=screenshot)


def _image_filename(original_filename: str | None, extension: str) -> str:
    if original_filename and "." in original_filename:
        return original_filename

    if original_filename:
        return f"{original_filename}{extension}"

    return f"uploaded-image{extension}"
