from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    screw_ids: List[int] = []
    
class ScrewBase(BaseModel):
    name: str
    length: int
    amount: Optional[int] = 0
    diameter: int
    typeOfHead: str
    
class ProjectBaseResponse(ProjectBase):
    screw_: List[ScrewBase] = []

    class Config:
        from_attributes = True

class ScrewResponse(ScrewBase):
    amount: int
    project_id: str

    class Config:
        from_attributes = True

class ScrewCreate(ScrewBase):
    id: Optional[str] = None
    project_id: Optional[str] = None
    timecreated: Optional[datetime] = None

class ScrewUpdate(ScrewBase):
    typeUpdate: str
    class Config:
        from_attributes = True
        
class ScrewAdjustAmount(ScrewBase):
    action: str  # "increment" or "decrement"
    
    class Config:
        from_attributes = True
    
        
class ProjectCreate(ProjectBase):
    id: Optional[str] = None
    type: str