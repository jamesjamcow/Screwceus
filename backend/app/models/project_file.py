from datetime import date, datetime

from sqlmodel import Field, SQLModel


class ProjectFile(SQLModel, table=True):
    __tablename__ = "project_file"

    id: int | None = Field(default=None, primary_key=True)
    owner_id: str = Field(index=True, max_length=255)
    organization_id: str = Field(foreign_key="organization.clerk_id", index=True, max_length=255)
    team_id: int = Field(foreign_key="team.id", index=True)
    folder_id: int | None = Field(default=None, foreign_key="folder.id", index=True)
    name: str = Field(max_length=255)
    description: str = Field(default="", max_length=2000)
    status: str = Field(default="planned", max_length=50)
    due_date: date | None = Field(default=None)
    cover_image_url: str = Field(default="", max_length=1024)
    cover_image_filename: str = Field(default="", max_length=255)
    cover_image_file_key: str = Field(default="", max_length=255)
    model_url: str = Field(default="", max_length=1024)
    model_filename: str = Field(default="", max_length=255)
    model_file_key: str = Field(default="", max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
