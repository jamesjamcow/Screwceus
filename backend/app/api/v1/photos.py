from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.security import get_current_user_id
from app.db.session import get_session
from app.models.photo import Photo
from app.schemas.photo import PhotoCreate, PhotoRead

router = APIRouter()


@router.get("/", response_model=list[PhotoRead])
def list_photos(
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> list[Photo]:
    statement = select(Photo).where(Photo.owner_id == user_id).order_by(Photo.created_at.desc())
    return list(session.exec(statement))


@router.post("/", response_model=PhotoRead)
def create_photo(
    payload: PhotoCreate,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> Photo:
    photo = Photo(
        owner_id=user_id,
        title=payload.title,
        image_key=payload.image_key,
        annotation_json=payload.annotation_json,
    )
    session.add(photo)
    session.commit()
    session.refresh(photo)
    return photo
