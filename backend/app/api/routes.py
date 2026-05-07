from fastapi import APIRouter

from app.api.v1.custom_part_types import router as custom_part_types_router
from app.api.v1.folders import router as folders_router
from app.api.v1.parts import router as parts_router
from app.api.v1.photos import router as photos_router
from app.api.v1.project_files import router as project_files_router
from app.api.v1.users import router as users_router

api_router = APIRouter()
api_router.include_router(photos_router, prefix="/v1/photos", tags=["photos"])
api_router.include_router(folders_router, prefix="/v1/folders", tags=["folders"])
api_router.include_router(parts_router, prefix="/v1/parts", tags=["parts"])
api_router.include_router(custom_part_types_router, prefix="/v1/part-types", tags=["part-types"])
api_router.include_router(project_files_router, prefix="/v1/projects", tags=["projects"])
api_router.include_router(users_router, prefix="/v1/users", tags=["users"])
