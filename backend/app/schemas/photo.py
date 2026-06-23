from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.project_file import ProjectScreenshotRead


class PhotoCreate(BaseModel):
    title: str
    image_url: str
    annotation_json: dict | None = None


class PhotoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: str
    organization_id: str
    title: str
    image_url: str
    annotation_json: dict | None
    created_at: datetime


class PhotoUploadRead(BaseModel):
    photo: PhotoRead
    screenshot: ProjectScreenshotRead | None
