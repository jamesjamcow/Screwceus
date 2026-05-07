from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.security import get_current_user_id
from app.db.session import get_session
from app.models.folder import Folder
from app.schemas.folder import FolderCreate, FolderRead, FolderTree, FolderUpdate

router = APIRouter()


@router.get("/", response_model=list[FolderRead])
def list_folders(
    parent_id: int | None = None,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> list[Folder]:
    statement = select(Folder).where(
        Folder.owner_id == user_id,
        Folder.parent_id == parent_id,
    ).order_by(Folder.name)
    return list(session.exec(statement))


@router.get("/tree", response_model=list[FolderTree])
def folder_tree(
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> list[FolderTree]:
    statement = select(Folder).where(Folder.owner_id == user_id).order_by(Folder.name)
    all_folders = list(session.exec(statement))

    lookup: dict[int, FolderTree] = {}
    for folder in all_folders:
        lookup[folder.id] = FolderTree.model_validate(folder)

    roots: list[FolderTree] = []
    for node in lookup.values():
        if node.parent_id is not None and node.parent_id in lookup:
            lookup[node.parent_id].children.append(node)
        else:
            roots.append(node)

    return roots


@router.get("/{folder_id}", response_model=FolderRead)
def get_folder(
    folder_id: int,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> Folder:
    folder = session.get(Folder, folder_id)
    if not folder or folder.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    return folder


@router.post("/", response_model=FolderRead, status_code=status.HTTP_201_CREATED)
def create_folder(
    payload: FolderCreate,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> Folder:
    if payload.parent_id is not None:
        parent = session.get(Folder, payload.parent_id)
        if not parent or parent.owner_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent folder not found")

    folder = Folder(owner_id=user_id, name=payload.name, parent_id=payload.parent_id)
    session.add(folder)
    session.commit()
    session.refresh(folder)
    return folder


@router.patch("/{folder_id}", response_model=FolderRead)
def update_folder(
    folder_id: int,
    payload: FolderUpdate,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> Folder:
    folder = session.get(Folder, folder_id)
    if not folder or folder.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    if payload.parent_id is not None:
        if payload.parent_id == folder_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Folder cannot be its own parent")
        parent = session.get(Folder, payload.parent_id)
        if not parent or parent.owner_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent folder not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(folder, key, value)
    folder.updated_at = datetime.utcnow()

    session.add(folder)
    session.commit()
    session.refresh(folder)
    return folder


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: int,
    user_id: str = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> None:
    folder = session.get(Folder, folder_id)
    if not folder or folder.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    # Recursively collect folder IDs to delete
    ids_to_delete = []
    queue = [folder_id]
    while queue:
        current = queue.pop()
        ids_to_delete.append(current)
        children = session.exec(
            select(Folder).where(Folder.parent_id == current, Folder.owner_id == user_id)
        ).all()
        queue.extend(child.id for child in children)

    # Delete folders deepest-first
    for fid in reversed(ids_to_delete):
        f = session.get(Folder, fid)
        if f:
            session.delete(f)

    session.commit()
