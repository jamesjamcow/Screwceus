from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PartCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = Field(min_length=1, max_length=100)
    dimensions: dict
    notes: str = Field(default="", max_length=2000)


class PartUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: str | None = Field(default=None, min_length=1, max_length=100)
    dimensions: dict | None = None
    notes: str | None = Field(default=None, max_length=2000)


class PartRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: str
    organization_id: str
    name: str
    type: str
    dimensions: dict
    notes: str
    created_at: datetime
    updated_at: datetime
