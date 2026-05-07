from datetime import datetime

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel

BASE_PART_TYPES = ["fastener", "spacer", "bearing", "connector", "bracket"]


class Part(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    owner_id: str = Field(index=True, max_length=255)
    name: str = Field(max_length=255)
    type: str = Field(max_length=100)
    dimensions: dict = Field(sa_column=Column(JSON, nullable=False))
    notes: str = Field(default="", max_length=2000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
