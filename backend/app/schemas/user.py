from datetime import datetime

from pydantic import BaseModel, Field


class UserRead(BaseModel):
    id: int
    clerk_id: str
    email: str
    display_name: str
    avatar_url: str
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=1024)
