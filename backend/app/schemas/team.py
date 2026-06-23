from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    key: str = Field(min_length=1, max_length=12, pattern=r"^[A-Za-z0-9]+$")
    color: str = Field(default="#5E6AD2", pattern=r"^#[0-9A-Fa-f]{6}$")

    @field_validator("name", "key")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class TeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: str
    name: str
    key: str
    color: str
    role: str = "member"
    created_at: datetime
    updated_at: datetime
