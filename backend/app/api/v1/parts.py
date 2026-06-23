from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.core.security import OrganizationContext, get_organization_context
from app.db.session import get_session
from app.models.part import BASE_PART_TYPES, Part
from app.models.custom_part_type import CustomPartType
from app.schemas.part import PartCreate, PartRead, PartUpdate

router = APIRouter()


def _validate_part_type(part_type: str, organization_id: str, session: Session) -> None:
    if part_type in BASE_PART_TYPES:
        return
    custom = session.exec(
        select(CustomPartType).where(
            CustomPartType.organization_id == organization_id,
            CustomPartType.value == part_type,
        )
    ).first()
    if not custom:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown part type: {part_type}",
        )


@router.get("/", response_model=list[PartRead])
def list_parts(
    part_type: str | None = Query(default=None, alias="type"),
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> list[Part]:
    statement = select(Part).where(Part.organization_id == context.organization_id)
    if part_type is not None:
        statement = statement.where(Part.type == part_type)
    statement = statement.order_by(Part.created_at.desc())
    return list(session.exec(statement))


@router.get("/{part_id}", response_model=PartRead)
def get_part(
    part_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> Part:
    part = session.get(Part, part_id)
    if not part or part.organization_id != context.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Part not found")
    return part


@router.post("/", response_model=PartRead, status_code=status.HTTP_201_CREATED)
def create_part(
    payload: PartCreate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> Part:
    _validate_part_type(payload.type, context.organization_id, session)

    part = Part(
        owner_id=context.user_id,
        organization_id=context.organization_id,
        name=payload.name,
        type=payload.type,
        dimensions=payload.dimensions,
        notes=payload.notes,
    )
    session.add(part)
    session.commit()
    session.refresh(part)
    return part


@router.patch("/{part_id}", response_model=PartRead)
def update_part(
    part_id: int,
    payload: PartUpdate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> Part:
    part = session.get(Part, part_id)
    if not part or part.organization_id != context.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Part not found")

    update_data = payload.model_dump(exclude_unset=True)

    if "type" in update_data:
        _validate_part_type(update_data["type"], context.organization_id, session)

    for key, value in update_data.items():
        setattr(part, key, value)
    part.updated_at = datetime.utcnow()

    session.add(part)
    session.commit()
    session.refresh(part)
    return part


@router.delete("/{part_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_part(
    part_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> None:
    part = session.get(Part, part_id)
    if not part or part.organization_id != context.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Part not found")
    session.delete(part)
    session.commit()
