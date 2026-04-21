from fastapi import APIRouter

from app.api.v1.photos import router as photos_router

api_router = APIRouter()
api_router.include_router(photos_router, prefix="/v1/photos", tags=["photos"])
