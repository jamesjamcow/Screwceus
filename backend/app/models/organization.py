from datetime import datetime

from sqlmodel import Field, SQLModel


class Organization(SQLModel, table=True):
    __tablename__ = "organization"

    id: int | None = Field(default=None, primary_key=True)
    clerk_id: str = Field(unique=True, index=True, max_length=255)
    name: str = Field(max_length=255)
    slug: str = Field(default="", max_length=255)
    image_url: str = Field(default="", max_length=1024)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
