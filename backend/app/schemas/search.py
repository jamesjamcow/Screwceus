from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class WorkspaceSearchResult(BaseModel):
    type: Literal["project", "issue"]
    issue_scope: Literal["project", "team"] | None = None
    id: int
    title: str
    description: str
    status: str
    project_id: int | None = None
    project_name: str
    team_id: int
    team_name: str
    updated_at: datetime


class WorkspaceSearchResponse(BaseModel):
    query: str
    results: list[WorkspaceSearchResult]
