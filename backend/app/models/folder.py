from datetime import datetime

from sqlmodel import Field, SQLModel


class Folder(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    owner_id: str = Field(index=True, max_length=255)
    organization_id: str = Field(foreign_key="organization.clerk_id", index=True, max_length=255)
    team_id: int = Field(foreign_key="team.id", index=True)
    name: str = Field(max_length=255)
    parent_id: int | None = Field(default=None, foreign_key="folder.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
