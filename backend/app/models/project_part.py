from datetime import datetime

from sqlalchemy import Column, JSON, UniqueConstraint
from sqlmodel import Field, SQLModel


class ProjectPart(SQLModel, table=True):
    __tablename__ = "project_part"
    __table_args__ = (
        UniqueConstraint("project_file_id", "part_id", name="uq_project_part"),
    )

    id: int | None = Field(default=None, primary_key=True)
    project_file_id: int = Field(foreign_key="project_file.id", index=True)
    part_id: int = Field(foreign_key="part.id", index=True)
    owner_id: str = Field(index=True, max_length=255)
    organization_id: str = Field(foreign_key="organization.clerk_id", index=True, max_length=255)
    point: list | None = Field(default=None, sa_column=Column(JSON, nullable=True))
    notes: str = Field(default="", max_length=2000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
