from datetime import datetime

from sqlmodel import Field, SQLModel


class ProjectFile(SQLModel, table=True):
    __tablename__ = "project_file"

    id: int | None = Field(default=None, primary_key=True)
    owner_id: str = Field(index=True, max_length=255)
    folder_id: int | None = Field(default=None, foreign_key="folder.id", index=True)
    name: str = Field(max_length=255)
    description: str = Field(default="", max_length=2000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
