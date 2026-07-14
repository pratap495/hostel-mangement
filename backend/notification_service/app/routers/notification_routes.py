from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.tenant_middleware import get_tenant_db
from app.core.security import require_owner_or_admin
from app.core.websocket_manager import manager
from app.controllers.notification_controller import fetch_logs, mark_as_read
from app.schemas.api_schemas import (
    PaginatedNotificationsResponse, NotificationReadResponse,
    SuccessResponse, ErrorResponse, HealthResponse
)

router = APIRouter(prefix="/notifications", tags=["Real-Time Notifications"])

@router.get(
    "/health", 
    include_in_schema=False
)
def health():
    """System health check."""
    return {"status": "healthy", "service": "notification_service"}

@router.get(
    "", 
    response_model=PaginatedNotificationsResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {
            "description": "Unauthorized - Missing or invalid access token",
            "content": {"application/json": {"example": {"detail": "Could not validate credentials"}}}
        },
        403: {
            "description": "Forbidden - First-time password change required",
            "content": {"application/json": {"example": {"detail": "FORCE_PASSWORD_RESET_REQUIRED: Please set your new password before accessing system resources."}}}
        },
        422: {
            "model": ErrorResponse,
            "description": "Validation Error",
            "content": {"application/json": {"example": {"detail": "Validation failed: 'page' must be greater than or equal to 1."}}}
        }
    }
)
def get_alert_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Retrieve paginated listings of notification log alerts (Task 6.6)."""
    return fetch_logs(db, page, limit)

@router.put(
    "/{log_id}/read", 
    response_model=NotificationReadResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {
            "description": "Unauthorized - Missing or invalid access token",
            "content": {"application/json": {"example": {"detail": "Could not validate credentials"}}}
        },
        403: {
            "description": "Forbidden - First-time password change required",
            "content": {"application/json": {"example": {"detail": "FORCE_PASSWORD_RESET_REQUIRED: Please set your new password before accessing system resources."}}}
        },
        404: {
            "description": "Not Found - Log ID does not exist",
            "content": {"application/json": {"example": {"detail": "Notification log not found."}}}
        },
        422: {
            "model": ErrorResponse,
            "description": "Validation Error",
            "content": {"application/json": {"example": {"detail": "Validation failed: 'log_id' must be a valid UUID."}}}
        }
    }
)
def read_alert_log(
    log_id: UUID,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Mark a specific alert log entry as read."""
    return mark_as_read(db, str(log_id))

@router.websocket("/ws/{hostel_id}")
async def websocket_alert_tunnel(websocket: WebSocket, hostel_id: str):
    """Establish WebSocket connection tunnel mapped by hostel ID (Task 6.3)."""
    await manager.connect(hostel_id, websocket)
    try:
        while True:
            # Maintain persistent connection loop
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(hostel_id, websocket)
