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
