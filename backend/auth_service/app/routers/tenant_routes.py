from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.core.database import get_admin_db
from app.core.security import get_current_user
from app.schemas.api_schemas import (
    OwnerCreateRequest, OwnerCreateResponse, OwnerUpdateRequest,
    StatusChangeRequest, HostelCreateRequest, HostelCreateResponse, HostelUpdateRequest,
    SuccessResponse, ErrorResponse, OwnerDetailsResponse, HostelDetailsResponse, DashboardStatsResponse
)
from app.controllers.tenant_controller import (
    create_owner_account, update_owner_status, update_owner_account,
    soft_delete_owner_account, provision_hostel_and_db, log_activity,
    get_owners_list, get_hostels_list, update_hostel_details, get_super_admin_stats
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
    owner_id: str,
    request: StatusChangeRequest,
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """Activate, deactivate, or trigger password reset on Owner dashboard access (Super Admin only)."""
    return update_owner_status(db, str(owner_id), request)

@router.put(
    "/owners/{owner_id}",
    response_model=SuccessResponse,
    responses={
        200: {
            "model": SuccessResponse,
            "description": "Successful Response",
            "content": {"application/json": {"example": {"message": "Owner profile updated successfully."}}}
        },
        404: {
            "model": ErrorResponse,
            "description": "Not Found Error"
        }
    }
)
def edit_owner_profile(
    owner_id: str,
    request: OwnerUpdateRequest,
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """Update Owner profile details (Super Admin only)."""
    update_owner_account(db, str(owner_id), request)
    return {"message": "Owner profile updated successfully."}

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
    owner_id: str,
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

@router.put(
    "/hostels/{hostel_id}",
    response_model=SuccessResponse,
    responses={
        200: {
            "model": SuccessResponse,
            "description": "Successful Response",
            "content": {"application/json": {"example": {"message": "Hostel updated successfully."}}}
        },
        404: {
            "model": ErrorResponse,
            "description": "Not Found Error",
            "content": {"application/json": {"example": {"detail": "Hostel not found"}}}
        }
    }
)
def update_hostel(
    hostel_id: str,
    request: HostelUpdateRequest,
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """Update hostel metadata details and reassign/set owner mapping (Super Admin only)."""
    res = update_hostel_details(db, str(hostel_id), request)
    return {"message": "Hostel updated successfully."}

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

@router.get(
    "/dashboard-stats",
    response_model=DashboardStatsResponse
)
def get_dashboard_stats(
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """Retrieve aggregated Super Admin dashboard statistics across all tenant databases."""
    return get_super_admin_stats(db)
