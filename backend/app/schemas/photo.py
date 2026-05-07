from datetime import datetime

from pydantic import BaseModel


class PhotoCreate(BaseModel):
    title: str
    image_url: str
    annotation_json: dict | None = None


class PhotoRead(BaseModel):
    id: int
    owner_id: str
    title: str
    image_url: str
    annotation_json: dict | None
    created_at: datetime
