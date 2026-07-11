from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.database import get_admin_db
from app.core.security import get_current_user
from app.schemas.api_schemas import (
    OwnerCreateRequest, OwnerCreateResponse, 
    StatusChangeRequest, HostelCreateRequest, HostelCreateResponse
)
from app.controllers.tenant_controller import (
    create_owner_account, update_owner_status, 
    soft_delete_owner_account, provision_hostel_and_db, log_activity
)

router = APIRouter(prefix="/tenants", tags=["Tenants Management"])

def require_super_admin(current_user: dict = Depends(get_current_user)):
    """Enforce that only authenticated Super Admins can access these routes."""
    if current_user.get("role") != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Super Admin access required."
        )
    return current_user

@router.post("/owners", response_model=OwnerCreateResponse, status_code=status.HTTP_201_CREATED)
def create_owner(
    request: OwnerCreateRequest,
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """Onboard a new Owner account (Super Admin only)."""
    return create_owner_account(db, request)

@router.post("/owners/{owner_id}/actions")
def update_owner(
    owner_id: UUID,
    request: StatusChangeRequest,
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """Activate, deactivate, or trigger password reset on Owner dashboard access (Super Admin only)."""
    return update_owner_status(db, str(owner_id), request)

@router.delete("/owners/{owner_id}")
def delete_owner(
    owner_id: UUID,
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """Soft delete an Owner account (Super Admin only)."""
    return soft_delete_owner_account(db, str(owner_id))

@router.post("/hostels", response_model=HostelCreateResponse, status_code=status.HTTP_201_CREATED)
def create_hostel(
    request: HostelCreateRequest,
    db: Session = Depends(get_admin_db),
    admin: dict = Depends(require_super_admin)
):
    """Onboard new hostel metadata and provision its dynamic PostgreSQL tenant database (Super Admin only)."""
    return provision_hostel_and_db(db, request)

@router.post("/activity-log")
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
    return {"status": "logged"}
