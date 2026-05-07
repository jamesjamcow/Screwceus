from datetime import datetime

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class CustomPartType(SQLModel, table=True):
    __tablename__ = "custom_part_type"
    __table_args__ = (UniqueConstraint("owner_id", "value", name="uq_owner_value"),)

    id: int | None = Field(default=None, primary_key=True)
    owner_id: str = Field(index=True, max_length=255)
    value: str = Field(max_length=100)
    label: str = Field(max_length=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
