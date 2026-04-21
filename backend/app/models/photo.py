from datetime import datetime

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class Photo(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    owner_id: str = Field(index=True, max_length=255)
    title: str = Field(max_length=255)
    image_key: str = Field(max_length=512)
    annotation_json: dict | None = Field(default=None, sa_column=Column(JSON, nullable=True))
    created_at: datetime = Field(default_factory=datetime.utcnow)
