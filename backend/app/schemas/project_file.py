from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.part import PartRead


class ProjectFileCreate(BaseModel):
    folder_id: int | None = None
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=2000)


class ProjectFileUpdate(BaseModel):
    folder_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)


class ProjectFileRead(BaseModel):
    id: int
    owner_id: str
    folder_id: int | None
    name: str
    description: str
    model_url: str
    model_filename: str
    model_file_key: str
    created_at: datetime
    updated_at: datetime


class ProjectScreenshotCreate(BaseModel):
    photo_id: int
    caption: str = Field(default="", max_length=500)
    sort_order: int = 0


class ProjectScreenshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_file_id: int
    photo_id: int
    owner_id: str
    caption: str
    sort_order: int
    created_at: datetime


class ProjectPartAdd(BaseModel):
    part_id: int
    quantity_needed: int = Field(default=1, ge=1)
    point: list[float] | None = None
    notes: str = Field(default="", max_length=2000)
    source_image_url: str = Field(default="", max_length=1024)
    annotation_json: dict | None = None


class ProjectPartEntryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = Field(min_length=1, max_length=100)
    dimensions: dict
    notes: str = Field(default="", max_length=2000)
    quantity_needed: int = Field(default=1, ge=1)
    point: list[float] | None = None
    source_image_url: str = Field(default="", max_length=1024)
    annotation_json: dict | None = None


class ProjectPartUpdate(BaseModel):
    quantity_needed: int | None = Field(default=None, ge=1)
    point: list[float] | None = None
    notes: str | None = Field(default=None, max_length=2000)
    source_image_url: str | None = Field(default=None, max_length=1024)
    annotation_json: dict | None = None


class ProjectPartRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_file_id: int
    part_id: int
    owner_id: str
    quantity_needed: int
    point: list[float] | None
    notes: str
    source_image_url: str
    annotation_json: dict | None
    created_at: datetime
    part: PartRead | None = None
