from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ScrewCreateBase(BaseModel):
    name: str
    length: int
    diameter: int
    typeOfHead: str
    
