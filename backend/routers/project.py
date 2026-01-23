import uuid 
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Cookie, Response, BackgroundTasks
from sqlalchemy.orm import Session
from db.database import get_db, SessionLocal
from schemas.project import ScrewBase, ProjectBase, ScrewCreate, ProjectBaseResponse, ScrewResponse, ScrewUpdate, ProjectCreate
from models.project import Project, Screw

from datetime import datetime


router = APIRouter( prefix="/projects", tags=["projects"] )

@router.post("/", response_model=ProjectBaseResponse)
def create_project(request: ProjectBase, response: Response, db: Session = Depends(get_db)):
    project_id = str(uuid.uuid4())
    new_project = Project(id=project_id, name=request.name, description=request.description)
    
    db.add(new_project)
    db.commit()
    
    return new_project

@router.get("/find/{project_id}", response_model=ProjectBaseResponse)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    parsed_project = parse_project(project)
    return parsed_project
    
@router.get("/get_all", response_model=list[ProjectBaseResponse])
def get_all_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()

    return projects

def parse_project(project: Project) -> ProjectBaseResponse:
    screw_list = []
    for screw in project.screws:
        screw_data = ScrewCreate(
            id=screw.id,
            name=screw.name,
            length=screw.length,
            diameter=screw.diameter,
            typeOfHead=screw.typeOfHead
        )
        screw_list.append(screw_data)
    
    project_response = ProjectBaseResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        screw_=screw_list,
    )
    return project_response

