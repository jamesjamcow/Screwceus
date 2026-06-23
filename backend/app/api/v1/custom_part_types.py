from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.security import OrganizationContext, get_organization_context
from app.db.session import get_session
from app.models.custom_part_type import CustomPartType
from app.models.part import BASE_PART_TYPES
from app.schemas.custom_part_type import CustomPartTypeCreate, CustomPartTypeRead, PartTypeOption

router = APIRouter()

BASE_OPTIONS = [
    PartTypeOption(value="fastener", label="Fastener"),
    PartTypeOption(value="spacer", label="Spacer"),
    PartTypeOption(value="bearing", label="Bearing"),
    PartTypeOption(value="connector", label="Connector"),
    PartTypeOption(value="bracket", label="Bracket"),
]


@router.get("/", response_model=list[PartTypeOption])
def list_part_types(
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> list[PartTypeOption]:
    """Return base types + user's custom types merged into one list."""
    custom = session.exec(
        select(CustomPartType)
        .where(CustomPartType.organization_id == context.organization_id)
        .order_by(CustomPartType.label)
    ).all()
    custom_options = [
        PartTypeOption(value=ct.value, label=ct.label, is_custom=True)
        for ct in custom
    ]
    return BASE_OPTIONS + custom_options


@router.post("/", response_model=CustomPartTypeRead, status_code=status.HTTP_201_CREATED)
def create_custom_part_type(
    payload: CustomPartTypeCreate,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> CustomPartType:
    if payload.value in BASE_PART_TYPES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"'{payload.value}' is a built-in type and cannot be overridden.",
        )

    existing = session.exec(
        select(CustomPartType).where(
            CustomPartType.organization_id == context.organization_id,
            CustomPartType.value == payload.value,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Custom type '{payload.value}' already exists.",
        )

    custom_type = CustomPartType(
        owner_id=context.user_id,
        organization_id=context.organization_id,
        value=payload.value,
        label=payload.label,
    )
    session.add(custom_type)
    session.commit()
    session.refresh(custom_type)
    return custom_type


@router.delete("/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_part_type(
    type_id: int,
    context: OrganizationContext = Depends(get_organization_context),
    session: Session = Depends(get_session),
) -> None:
    custom_type = session.get(CustomPartType, type_id)
    if not custom_type or custom_type.organization_id != context.organization_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom type not found")
    session.delete(custom_type)
    session.commit()
