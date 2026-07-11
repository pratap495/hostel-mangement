import random
import string
import uuid
import logging
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.db_models import Owner, Hostel, OwnerHostel, TenantDatabase, OwnerActivityLog
from app.schemas.api_schemas import OwnerCreateRequest, StatusChangeRequest, HostelCreateRequest
from app.core.security import get_password_hash
from app.core.config import settings

logger = logging.getLogger(__name__)

def generate_temp_password(length: int = 12) -> str:
    """Generate a secure, random temporary password containing uppercase, lowercase, numbers, and symbols."""
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return "HMint@" + "".join(random.choice(chars) for _ in range(length - 6))

def log_activity(db: Session, owner_id: str, action: str, hostel_id: str, ip_address: str, user_agent: str):
    """Log owner state-modifying actions into the central admin DB for accountability."""
    log = OwnerActivityLog(
        owner_id=uuid.UUID(str(owner_id)),
        action=action,
        hostel_id=uuid.UUID(str(hostel_id)) if hostel_id else None,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(log)
    db.commit()

def create_owner_account(db: Session, request: OwnerCreateRequest) -> dict:
    """Register a new Owner account and generate default temporary password."""
    email_clean = request.email.lower()
    
    # Check duplicate email
    existing_owner = db.query(Owner).filter(Owner.email == email_clean, Owner.is_deleted == False).first()
    if existing_owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active owner account with this email already exists."
        )
        
    temp_pass = generate_temp_password()
    hashed_pass = get_password_hash(temp_pass)
    
    new_owner = Owner(
        email=email_clean,
        name=request.name,
        phone=request.phone,
        password_hash=hashed_pass,
        force_password_reset=True,
        is_active=True
    )
    
    db.add(new_owner)
    db.commit()
    db.refresh(new_owner)
    
    return {
        "id": new_owner.id,
        "email": new_owner.email,
        "temp_password": temp_pass
    }

def update_owner_status(db: Session, owner_id: str, request: StatusChangeRequest) -> dict:
    """Suspend, reactivate, or trigger password reset on Owner account."""
    owner = db.query(Owner).filter(Owner.id == owner_id, Owner.is_deleted == False).first()
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found")
        
    if request.action == "disable":
        owner.is_active = False
        db.commit()
        return {"owner_id": owner.id, "status": "disabled", "message": "Owner dashboard access has been suspended."}
        
    elif request.action == "enable":
        owner.is_active = True
        db.commit()
        return {"owner_id": owner.id, "status": "active", "message": "Owner dashboard access has been restored."}
        
    elif request.action == "reset_password":
        temp_pass = generate_temp_password()
        owner.password_hash = get_password_hash(temp_pass)
        owner.force_password_reset = True
        db.commit()
        return {
            "owner_id": owner.id,
            "status": "password_reset",
            "temp_password": temp_pass,
            "message": "Temporary password reset completed."
        }

def soft_delete_owner_account(db: Session, owner_id: str) -> dict:
    """Soft delete an Owner account and flag its timestamp."""
    owner = db.query(Owner).filter(Owner.id == owner_id, Owner.is_deleted == False).first()
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found")
        
    owner.is_deleted = True
    owner.deleted_at = datetime.utcnow()
    db.commit()
    return {"owner_id": owner.id, "status": "soft_deleted"}

def provision_hostel_and_db(db: Session, request: HostelCreateRequest) -> dict:
    """Onboard new hostel record, create dynamic tenant database and execute migrations."""
    new_hostel = Hostel(
        name=request.name,
        address=request.address,
        contact_number=request.contact_number,
        floors_count=request.floors_count,
        rooms_count=request.rooms_count
    )
    db.add(new_hostel)
    db.commit()
    db.refresh(new_hostel)
    
    # Standard dynamic DB naming convention
    db_name = f"hostelmint_hostel_{str(new_hostel.id).replace('-', '_')}_db"
    
    # 1. Create dynamic Postgres database
    # Connect directly to central postgres instance outside transactions
    central_engine = db.bind
    raw_conn = central_engine.raw_connection()
    raw_conn.set_isolation_level(0) # AUTOCOMMIT
    cursor = raw_conn.cursor()
    try:
        cursor.execute(f'CREATE DATABASE "{db_name}"')
    except Exception as e:
        logger.error(f"Failed to create dynamic database {db_name}: {e}")
        db.delete(new_hostel)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to provision dynamic database on Postgres server."
        )
    finally:
        cursor.close()
        raw_conn.close()

    # Parse central DB URL connection variables to point to the new DB
    from urllib.parse import urlparse, urlunparse
    parsed = urlparse(settings.CENTRAL_DATABASE_URL)
    # Rebuild connection URL for the newly created tenant DB
    tenant_db_url = urlunparse(parsed._replace(path=f"/{db_name}"))
    
    # 2. Programmatically trigger alembic migrations on the new DB
    from app.core.alembic_runner import run_tenant_migrations
    try:
        run_tenant_migrations(tenant_db_url)
    except Exception as e:
        logger.error(f"Failed to migrate database {db_name}: {e}")
        # Clean up database if migration fails to prevent orphaned database structures
        raw_conn = central_engine.raw_connection()
        raw_conn.set_isolation_level(0)
        cursor = raw_conn.cursor()
        cursor.execute(f'DROP DATABASE IF EXISTS "{db_name}"')
        cursor.close()
        raw_conn.close()
        db.delete(new_hostel)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dynamic database migration upgrade failed: {e}"
        )

    # 3. Save connection record in Central tenant DB registry
    tenant_db = TenantDatabase(
        hostel_id=new_hostel.id,
        db_name=db_name,
        db_host=parsed.hostname or "postgres-db",
        db_port=parsed.port or 5432,
        db_username=parsed.username or "central_admin",
        db_password_hash=parsed.password or "password123"
    )
    db.add(tenant_db)
    db.commit()
    
    return {
        "hostel_id": new_hostel.id,
        "db_name": db_name,
        "status": "provisioned_and_migrated"
    }
