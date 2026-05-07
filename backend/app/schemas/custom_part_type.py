from datetime import datetime

from pydantic import BaseModel, Field


class CustomPartTypeCreate(BaseModel):
    value: str = Field(min_length=1, max_length=100)
    label: str = Field(min_length=1, max_length=100)


class CustomPartTypeRead(BaseModel):
    id: int
    owner_id: str
    value: str
    label: str
    created_at: datetime


class PartTypeOption(BaseModel):
    value: str
    label: str
    is_custom: bool = False
