from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.core.database import get_admin_db
from app.core.security import get_current_user
from app.schemas.api_schemas import (
    OwnerCreateRequest, OwnerCreateResponse, 
    StatusChangeRequest, HostelCreateRequest, HostelCreateResponse,
    SuccessResponse, ErrorResponse, OwnerDetailsResponse, HostelDetailsResponse
)
from app.controllers.tenant_controller import (
    create_owner_account, update_owner_status, 
    soft_delete_owner_account, provision_hostel_and_db, log_activity,
    get_owners_list, get_hostels_list
)

router = APIRouter(
    prefix="/tenants", 
    tags=["Tenants Management"],
    responses={
        422: {
            "model": ErrorResponse,
            "description": "Validation Error"
        }
    }
)

def require_super_admin(current_user: dict = Depends(get_current_user)):
    """Enforce that only authenticated Super Admins can access these routes."""
    if current_user.get("role") != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Super Admin access required."
        )
    return current_user

@router.post(
    "/owners", 
    response_model=OwnerCreateResponse, 
    status_code=status.HTTP_201_CREATED,
    responses={
        422: {
            "model": ErrorResponse,
            "description": "Validation Error",
            "content": {"application/json": {"example": {"detail": "Validation failed: 'email' value is not a valid email address; 'name' is required."}}}
        }
    }
)
def create_owner(
    request: OwnerCreateRequest,
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """Onboard a new Owner account (Super Admin only)."""
    return create_owner_account(db, request)

@router.post(
    "/owners/{owner_id}/actions", 
    response_model=SuccessResponse,
    responses={
        200: {
            "model": SuccessResponse,
            "description": "Successful Response",
            "content": {"application/json": {"example": {"message": "Owner status updated successfully."}}}
        },
        422: {
            "model": ErrorResponse,
            "description": "Validation Error",
            "content": {"application/json": {"example": {"detail": "Validation failed: 'action' must match standard action types (enable, disable, reset_password)."}}}
        }
    }
)
def update_owner(
    owner_id: UUID,
    request: StatusChangeRequest,
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """Activate, deactivate, or trigger password reset on Owner dashboard access (Super Admin only)."""
    return update_owner_status(db, str(owner_id), request)

@router.delete(
    "/owners/{owner_id}", 
    response_model=SuccessResponse,
    responses={
        200: {
            "model": SuccessResponse,
            "description": "Successful Response",
            "content": {"application/json": {"example": {"message": "Owner account successfully deleted."}}}
        },
        422: {
            "model": ErrorResponse,
            "description": "Validation Error",
            "content": {"application/json": {"example": {"detail": "Validation failed: 'owner_id' must be a valid UUID."}}}
        }
    }
)
def delete_owner(
    owner_id: UUID,
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """Soft delete an Owner account (Super Admin only)."""
    return soft_delete_owner_account(db, str(owner_id))

@router.post(
    "/hostels", 
    response_model=HostelCreateResponse, 
    status_code=status.HTTP_201_CREATED,
    responses={
        422: {
            "model": ErrorResponse,
            "description": "Validation Error",
            "content": {"application/json": {"example": {"detail": "Validation failed: 'name' is required; 'floors_count' must be greater than 0."}}}
        }
    }
)
def create_hostel(
    request: HostelCreateRequest,
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """Onboard new hostel metadata and provision its dynamic PostgreSQL tenant database (Super Admin only)."""
    return provision_hostel_and_db(db, request)

@router.post(
    "/activity-log", 
    response_model=SuccessResponse,
    responses={
        200: {
            "model": SuccessResponse,
            "description": "Successful Response",
            "content": {"application/json": {"example": {"message": "Activity log recorded successfully."}}}
        },
        422: {
            "model": ErrorResponse,
            "description": "Validation Error",
            "content": {"application/json": {"example": {"detail": "Validation failed: 'action' is required."}}}
        }
    }
)
def create_activity_log(
    action: str,
    hostel_id: str = None,
    db: Session = Depends(get_admin_db),
    user_payload: dict = Depends(get_current_user),
    request: Request = None
):
    """Log owner actions to the Super Admin audit trails. Can be called internally by other microservices."""
    client_ip = request.client.host if request and request.client else "0.0.0.0"
    user_agent = request.headers.get("user-agent", "Unknown")
    
    log_activity(
        db=db,
        owner_id=user_payload["sub"],
        action=action,
        hostel_id=hostel_id,
        ip_address=client_ip,
        user_agent=user_agent
    )
    return {"message": "Activity log recorded successfully."}

@router.get(
    "/owners",
    response_model=List[OwnerDetailsResponse]
)
def list_owners(
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """List all registered Owner profiles (Super Admin only)."""
    return get_owners_list(db)

@router.get(
    "/hostels",
    response_model=List[HostelDetailsResponse]
)
def list_hostels(
    db: Session = Depends(get_admin_db),
    current_user: dict = Depends(get_current_user)
):
    """List hostels filtered by active user context (Super Admin gets all, Owner gets their own)."""
    return get_hostels_list(db, current_user)
