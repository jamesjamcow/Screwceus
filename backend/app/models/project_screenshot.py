from datetime import datetime

from sqlmodel import Field, SQLModel


class ProjectScreenshot(SQLModel, table=True):
    __tablename__ = "project_screenshot"

    id: int | None = Field(default=None, primary_key=True)
    project_file_id: int = Field(foreign_key="project_file.id", index=True)
    photo_id: int = Field(foreign_key="photo.id", index=True)
    owner_id: str = Field(index=True, max_length=255)
    organization_id: str = Field(foreign_key="organization.clerk_id", index=True, max_length=255)
    caption: str = Field(default="", max_length=500)
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
