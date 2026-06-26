from datetime import datetime
from typing import Literal
from urllib.parse import urlparse

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    key: str = Field(min_length=1, max_length=12, pattern=r"^[A-Za-z0-9]+$")
    color: str = Field(default="#5E6AD2", pattern=r"^#[0-9A-Fa-f]{6}$")
    member_ids: list[str] = Field(default_factory=list, max_length=100)

    @field_validator("name", "key")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("member_ids")
    @classmethod
    def validate_member_ids(cls, values: list[str]) -> list[str]:
        normalized = list(dict.fromkeys(value.strip() for value in values if value.strip()))
        if any(not value.startswith("user_") for value in normalized):
            raise ValueError("Team members must be valid Clerk users")
        return normalized


class TeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: str
    name: str
    key: str
    color: str
    description: str
    role: str = "member"
    created_at: datetime
    updated_at: datetime


class TeamUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    description: str = Field(max_length=2000)


class TeamResourceCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=1000)
    url: str = Field(min_length=1, max_length=2048)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("Link must be a valid HTTP or HTTPS URL")
        return value


class TeamResourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    team_id: int
    created_by: str
    name: str
    description: str
    url: str
    created_at: datetime
    updated_at: datetime


class TeamIssueCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    issue: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=2000)
    author: str = Field(min_length=1, max_length=255)
    status: Literal["not-started", "in-progress", "blocked", "resolved"] = "not-started"


class TeamIssueUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    issue: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    author: str | None = Field(default=None, min_length=1, max_length=255)
    status: Literal["not-started", "in-progress", "blocked", "resolved"] | None = None


class TeamIssueRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    team_id: int
    owner_id: str
    organization_id: str
    issue: str
    description: str
    author: str
    status: str
    created_at: datetime
    updated_at: datetime
