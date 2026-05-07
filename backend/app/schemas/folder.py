from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    parent_id: int | None = None


class FolderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    parent_id: int | None = None


class FolderRead(BaseModel):
    id: int
    owner_id: str
    name: str
    parent_id: int | None
    created_at: datetime
    updated_at: datetime


class FolderTree(FolderRead):
    children: list[FolderTree] = []
