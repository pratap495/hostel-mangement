from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.tenant_middleware import get_tenant_db
from app.core.security import require_owner_or_admin
from app.schemas.api_schemas import RoomCreateRequest, RoomResponse, RoomAssignmentRequest, RoomTransferRequest
from app.controllers.room_controller import (
    add_room, allocate_bed, transfer_hosteler_room, soft_delete_room, restore_room_item
)

router = APIRouter(prefix="/rooms", tags=["Rooms Operations"])

@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    request: RoomCreateRequest,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Add a new room to the active hostel inventory (Owner/Admin only)."""
    return add_room(db, request)

@router.post("/assign", status_code=status.HTTP_200_OK)
def assign_bed_space(
    request: RoomAssignmentRequest,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Allocate a bed slot to a hosteler while checking capacity limitations (Owner/Admin only)."""
    return allocate_bed(db, request)

@router.post("/transfer", status_code=status.HTTP_200_OK)
def transfer_resident(
    request: RoomTransferRequest,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Execute room transfer for a hosteler inside a transaction block (Owner/Admin only)."""
    return transfer_hosteler_room(db, request)

@router.delete("/{room_id}", status_code=status.HTTP_200_OK)
def delete_room(
    room_id: UUID,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Soft delete a room in the dynamic tenant database (Owner/Admin only)."""
    return soft_delete_room(db, str(room_id))

@router.post("/{room_id}/restore", status_code=status.HTTP_200_OK)
def restore_room(
    room_id: UUID,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Restore a previously soft deleted room (Owner/Admin only)."""
    return restore_room_item(db, str(room_id))
