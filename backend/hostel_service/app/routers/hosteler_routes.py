from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from typing import Optional
from app.core.tenant_middleware import get_tenant_db
from app.core.security import require_owner_or_admin
from app.schemas.api_schemas import (
    HostelerCreateRequest, HostelerResponse, HostelerEditRequest, PaginatedHostelersResponse
)
from app.controllers.hosteler_controller import (
    register_hosteler, edit_hosteler_profile, search_residents, 
    soft_delete_hosteler_profile, restore_hosteler_profile
)
from app.core.s3_helper import get_presigned_upload_url

router = APIRouter(prefix="/hostelers", tags=["Hostelers Profiles"])

@router.post("", response_model=HostelerResponse, status_code=status.HTTP_201_CREATED)
def create_hosteler(
    request: HostelerCreateRequest,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Register a new Hosteler profile and assign storage identifiers (Owner/Admin only)."""
    return register_hosteler(db, request)

@router.put("/{hosteler_id}", response_model=HostelerResponse)
def edit_hosteler(
    hosteler_id: UUID,
    request: HostelerEditRequest,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Edit an existing resident profile and handle vacate/check-out logs (Owner/Admin only)."""
    return edit_hosteler_profile(db, str(hosteler_id), request)

@router.get("", response_model=PaginatedHostelersResponse)
def get_hostelers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    room_number: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    joining_date: Optional[date] = Query(None),
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Search and filter residents with offset pagination (Owner/Admin only)."""
    return search_residents(
        db=db,
        page=page,
        limit=limit,
        search=search,
        room_number=room_number,
        is_active=is_active,
        joining_date=joining_date
    )

@router.delete("/{hosteler_id}")
def delete_hosteler(
    hosteler_id: UUID,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Soft delete a hosteler profile and vacate active bed slots (Owner/Admin only)."""
    return soft_delete_hosteler_profile(db, str(hosteler_id))

@router.post("/{hosteler_id}/restore")
def restore_hosteler(
    hosteler_id: UUID,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Restore a previously soft deleted hosteler profile (Owner/Admin only)."""
    return restore_hosteler_profile(db, str(hosteler_id))

@router.post("/presigned-upload")
def request_presigned_upload(
    file_name: str,
    mime_type: str,
    user: dict = Depends(require_owner_or_admin)
):
    """Request a secure S3 presigned POST upload policy dictionary for Aadhaar or profile scans (Owner/Admin only)."""
    return get_presigned_upload_url(file_name, mime_type)
