from datetime import datetime

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    clerk_id: str = Field(unique=True, index=True, max_length=255)
    email: str = Field(default="", max_length=320)
    display_name: str = Field(default="", max_length=255)
    avatar_url: str = Field(default="", max_length=1024)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
