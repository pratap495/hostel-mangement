from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.tenant_middleware import get_tenant_db
from app.core.security import require_owner_or_admin
from app.core.websocket_manager import manager
from app.controllers.notification_controller import fetch_logs, mark_as_read

router = APIRouter(prefix="/notifications", tags=["Real-Time Notifications"])

@router.get("", status_code=200)
def get_alert_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Retrieve paginated listings of notification log alerts (Task 6.6)."""
    return fetch_logs(db, page, limit)

@router.put("/{log_id}/read", status_code=200)
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
