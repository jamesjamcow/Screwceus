from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.part import PartRead


class ProjectFileCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    folder_id: int | None = None
    team_id: int | None = Field(default=None, gt=0)
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    status: Literal["planned", "in_progress", "on_hold", "completed"] | None = None
    due_date: date | None = None


class ProjectFileUpdate(BaseModel):
    folder_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    status: Literal["planned", "in_progress", "on_hold", "completed"] | None = None
    due_date: date | None = None


class ProjectFileRead(BaseModel):
    id: int
    owner_id: str
    organization_id: str
    team_id: int
    folder_id: int | None
    name: str
    description: str
    status: str
    due_date: date | None
    cover_image_url: str
    cover_image_filename: str
    cover_image_file_key: str
    model_url: str
    model_filename: str
    model_file_key: str
    created_at: datetime
    updated_at: datetime


class ProjectIssueCreate(BaseModel):
    issue: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=2000)
    author: str = Field(min_length=1, max_length=255)
    status: Literal["not-started", "in-progress", "blocked", "resolved"] = "not-started"


class ProjectIssueUpdate(BaseModel):
    issue: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    author: str | None = Field(default=None, min_length=1, max_length=255)
    status: Literal["not-started", "in-progress", "blocked", "resolved"] | None = None


class ProjectIssueRead(BaseModel):
    id: int
    project_file_id: int
    owner_id: str
    organization_id: str
    issue: str
    description: str
    author: str
    status: str
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
    organization_id: str
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
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_file_id: int
    part_id: int
    owner_id: str
    organization_id: str
    point: list[float] | None
    notes: str
    created_at: datetime
    part: PartRead
