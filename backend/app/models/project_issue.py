from datetime import datetime

from sqlmodel import Field, SQLModel


class ProjectIssue(SQLModel, table=True):
    __tablename__ = "project_issue"

    id: int | None = Field(default=None, primary_key=True)
    project_file_id: int = Field(foreign_key="project_file.id", index=True)
    owner_id: str = Field(index=True, max_length=255)
    organization_id: str = Field(foreign_key="organization.clerk_id", index=True, max_length=255)
    issue: str = Field(max_length=255)
    description: str = Field(default="", max_length=2000)
    author: str = Field(max_length=255)
    status: str = Field(default="not-started", max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
