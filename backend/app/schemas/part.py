from datetime import datetime

from pydantic import BaseModel, Field


class PartCreate(BaseModel):
    folder_id: int | None = None
    name: str = Field(min_length=1, max_length=255)
    type: str = Field(min_length=1, max_length=100)
    dimensions: dict
    notes: str = Field(default="", max_length=2000)


class PartUpdate(BaseModel):
    folder_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: str | None = Field(default=None, min_length=1, max_length=100)
    dimensions: dict | None = None
    notes: str | None = Field(default=None, max_length=2000)


class PartRead(BaseModel):
    id: int
    owner_id: str
    folder_id: int | None
    name: str
    type: str
    dimensions: dict
    notes: str
    created_at: datetime
    updated_at: datetime
