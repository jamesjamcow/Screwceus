from datetime import datetime

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class Team(SQLModel, table=True):
    __tablename__ = "team"
    __table_args__ = (
        UniqueConstraint("organization_id", "key", name="uq_team_organization_key"),
    )

    id: int | None = Field(default=None, primary_key=True)
    organization_id: str = Field(foreign_key="organization.clerk_id", index=True, max_length=255)
    name: str = Field(max_length=255)
    key: str = Field(max_length=12)
    color: str = Field(default="#5E6AD2", max_length=20)
    description: str = Field(default="", max_length=2000)
    created_by: str = Field(foreign_key="user.clerk_id", index=True, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TeamMembership(SQLModel, table=True):
    __tablename__ = "team_membership"
    __table_args__ = (
        UniqueConstraint("team_id", "user_id", name="uq_team_membership_team_user"),
    )

    id: int | None = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id", index=True)
    user_id: str = Field(foreign_key="user.clerk_id", index=True, max_length=255)
    role: str = Field(default="member", max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TeamResource(SQLModel, table=True):
    __tablename__ = "team_resource"

    id: int | None = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id", index=True)
    created_by: str = Field(foreign_key="user.clerk_id", index=True, max_length=255)
    name: str = Field(max_length=255)
    description: str = Field(max_length=1000)
    url: str = Field(max_length=2048)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TeamIssue(SQLModel, table=True):
    __tablename__ = "team_issue"

    id: int | None = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id", index=True)
    owner_id: str = Field(foreign_key="user.clerk_id", index=True, max_length=255)
    organization_id: str = Field(foreign_key="organization.clerk_id", index=True, max_length=255)
    issue: str = Field(max_length=255)
    description: str = Field(max_length=2000)
    author: str = Field(max_length=255)
    status: str = Field(default="not-started", max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
