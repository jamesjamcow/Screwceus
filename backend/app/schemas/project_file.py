from datetime import datetime

from pydantic import BaseModel, Field


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
    created_at: datetime
    updated_at: datetime


class ProjectScreenshotCreate(BaseModel):
    photo_id: int
    caption: str = Field(default="", max_length=500)
    sort_order: int = 0


class ProjectScreenshotRead(BaseModel):
    id: int
    project_file_id: int
    photo_id: int
    owner_id: str
    caption: str
    sort_order: int
    created_at: datetime


class ProjectPartAdd(BaseModel):
    part_id: int
    point: list[float] | None = None
    notes: str = Field(default="", max_length=2000)


class ProjectPartUpdate(BaseModel):
    point: list[float] | None = None
    notes: str | None = Field(default=None, max_length=2000)


class ProjectPartRead(BaseModel):
    id: int
    project_file_id: int
    part_id: int
    owner_id: str
    point: list[float] | None
    notes: str
    created_at: datetime
