import logging
from uuid import UUID
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.models.db_models import NotificationLog
from app.core.database import CentralSession
from app.core.tenant_middleware import CentralTenantRegistry

logger = logging.getLogger(__name__)

# Engine connection pool cache for the event listener thread
listener_engines = {}

def get_tenant_session_for_listener(hostel_id: str) -> Session:
    """Fetch or spin up a dynamic connection session for the background event logger."""
    engine = listener_engines.get(hostel_id)
    if not engine:
        central_db = CentralSession()
        try:
            registry = central_db.query(CentralTenantRegistry).filter(
                CentralTenantRegistry.hostel_id == hostel_id
            ).first()
            if not registry:
                raise ValueError(f"Tenant database connection registry not found for hostel: {hostel_id}")
                
            connection_url = f"postgresql://{registry.db_username}:{registry.db_password_hash}@{registry.db_host}:{registry.db_port}/{registry.db_name}"
            engine = create_engine(connection_url, pool_pre_ping=True)
            listener_engines[hostel_id] = engine
        finally:
            central_db.close()
            
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()

def log_notification_to_db(hostel_id: str, event_type: str, message: str) -> NotificationLog:
    """Save an incoming event message directly into the tenant's notification logs (Task 6.1)."""
    try:
        session = get_tenant_session_for_listener(hostel_id)
        # Map event type to database ENUM mappings
        db_event_type = "rent_overdue"
        if event_type in ["rent_overdue", "room_full", "headcount"]:
            db_event_type = event_type
            
        new_log = NotificationLog(
            notification_type=db_event_type,
            message=message,
            is_read=False
        )
        session.add(new_log)
        session.commit()
        session.refresh(new_log)
        session.close()
        logger.info(f"Successfully logged event to tenant DB: {hostel_id}")
        return new_log
    except Exception as e:
        logger.error(f"Error logging notification to tenant database {hostel_id}: {e}")
        return None

def fetch_logs(db: Session, page: int, limit: int) -> dict:
    """Fetch paginated notification logs (Task 6.6)."""
    query = db.query(NotificationLog)
    
    total_records = query.count()
    total_pages = (total_records + limit - 1) // limit
    
    offset = (page - 1) * limit
    results = query.order_by(NotificationLog.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "data": results,
        "pagination": {
            "total_records": total_records,
            "current_page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    }

def mark_as_read(db: Session, log_id: str) -> dict:
    """Mark a notification log entry as read."""
    log = db.query(NotificationLog).filter(NotificationLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification log not found.")
        
    log.is_read = True
    db.commit()
    return {"log_id": log.id, "is_read": True}
