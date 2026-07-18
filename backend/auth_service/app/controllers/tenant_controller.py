import random
import string
import uuid
import logging
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.db_models import Owner, Hostel, OwnerHostel, TenantDatabase, OwnerActivityLog
from app.schemas.api_schemas import OwnerCreateRequest, StatusChangeRequest, HostelCreateRequest, HostelUpdateRequest

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
        
    if request.password:
        temp_pass = request.password
    else:
        temp_pass = generate_temp_password()
        
    hashed_pass = get_password_hash(temp_pass)
    
    new_owner = Owner(
        email=email_clean,
        name=request.name,
        phone=request.phone,
        password_hash=hashed_pass,
        force_password_reset=True,  # Always force reset on first login regardless of who set the password
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
        rooms_count=request.rooms_count,
        image_url=request.image_url
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

    tenant_db = TenantDatabase(
        hostel_id=new_hostel.id,
        db_name=db_name,
        db_host=parsed.hostname or "postgres-db",
        db_port=parsed.port or 5432,
        db_username=parsed.username or "central_admin",
        db_password_hash=parsed.password or "password123"
    )
    db.add(tenant_db)
    
    if request.owner_email:
        owner = db.query(Owner).filter(Owner.email == request.owner_email, Owner.is_deleted == False).first()
        if owner:
            mapping = OwnerHostel(owner_id=owner.id, hostel_id=new_hostel.id)
            db.add(mapping)
            
    db.commit()
    
    return {
        "hostel_id": new_hostel.id,
        "db_name": db_name,
        "status": "provisioned_and_migrated"
    }

def update_hostel_details(db: Session, hostel_id: str, request: HostelUpdateRequest) -> dict:
    """Update hostel metadata details and reassign/set owner mapping."""
    hostel = db.query(Hostel).filter(Hostel.id == uuid.UUID(hostel_id), Hostel.is_deleted == False).first()
    if not hostel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hostel not found")
        
    hostel.name = request.name
    hostel.address = request.address
    hostel.contact_number = request.contact_number
    hostel.floors_count = request.floors_count
    hostel.rooms_count = request.rooms_count
    hostel.image_url = request.image_url
    
    # Update owner mapping
    db.query(OwnerHostel).filter(OwnerHostel.hostel_id == hostel.id).delete()
    if request.owner_email:
        owner = db.query(Owner).filter(Owner.email == request.owner_email.lower(), Owner.is_deleted == False).first()
        if owner:
            mapping = OwnerHostel(owner_id=owner.id, hostel_id=hostel.id)
            db.add(mapping)
            
    db.commit()
    return {"hostel_id": hostel.id, "status": "updated"}

def get_owners_list(db: Session) -> list:
    """Fetch all active owner accounts and their linked hostels."""
    owners = db.query(Owner).filter(Owner.is_deleted == False).all()
    results = []
    for owner in owners:
        assigned = db.query(OwnerHostel.hostel_id).filter(OwnerHostel.owner_id == owner.id).all()
        hostels_assigned = [str(row[0]) for row in assigned]  # Convert UUID → string for frontend compatibility
        results.append({
            "id": owner.id,
            "email": owner.email,
            "name": owner.name,
            "phone": owner.phone,
            "is_active": owner.is_active,
            "hostels_assigned": hostels_assigned
        })
    return results

def get_hostels_list(db: Session, current_user: dict) -> list:
    """Fetch active hostels filtered by user permission context (Super Admin or Owner)."""
    from sqlalchemy import create_engine, text
    user_id = uuid.UUID(str(current_user.get("sub")))
    role = current_user.get("role")
    
    if role == "SUPER_ADMIN":
        hostels = db.query(Hostel).filter(Hostel.is_deleted == False).all()
    else:
        hostels = db.query(Hostel).join(OwnerHostel, OwnerHostel.hostel_id == Hostel.id)\
                    .filter(OwnerHostel.owner_id == user_id, Hostel.is_deleted == False).all()
                    
    results = []
    for hostel in hostels:
        owner_mapping = db.query(OwnerHostel).filter(OwnerHostel.hostel_id == hostel.id).first()
        owner_name, owner_email, owner_phone = None, None, None
        if owner_mapping:
            owner = db.query(Owner).filter(Owner.id == owner_mapping.owner_id).first()
            if owner:
                owner_name = owner.name
                owner_email = owner.email
                owner_phone = owner.phone
                
        # Query dynamic tenant database metrics
        occupied_beds = 0
        monthly_income = 0.0
        total_hostelers = 0
        
        tenant_db = db.query(TenantDatabase).filter(TenantDatabase.hostel_id == hostel.id).first()
        if tenant_db:
            db_url = f"postgresql://{tenant_db.db_username}:password123@postgres-db:5432/{tenant_db.db_name}"
            try:
                engine = create_engine(db_url)
                with engine.connect() as conn:
                    # Query active occupied beds
                    beds_res = conn.execute(text("SELECT COUNT(*) FROM room_assignments WHERE is_active = true AND transferred_date IS NULL;"))
                    occupied_beds = beds_res.scalar() or 0
                    
                    # Query active headcount
                    hostelers_res = conn.execute(text("SELECT COUNT(*) FROM hostelers WHERE is_active = true AND is_deleted = false;"))
                    total_hostelers = hostelers_res.scalar() or 0
                    
                    # Query monthly income (current calendar month)
                    rev_res = conn.execute(text("""
                        SELECT COALESCE(SUM(amount), 0.0) 
                        FROM income 
                        WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                          AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE);
                    """))
                    monthly_income = float(rev_res.scalar() or 0.0)
            except Exception:
                pass

        results.append({
            "id": hostel.id,
            "name": hostel.name,
            "address": hostel.address,
            "contact_number": hostel.contact_number,
            "floors_count": hostel.floors_count,
            "rooms_count": hostel.rooms_count,
            "is_active": True,
            "owner_name": owner_name,
            "owner_email": owner_email,
            "owner_phone": owner_phone,
            "image_url": hostel.image_url,
            "occupied_beds": occupied_beds,
            "monthly_income": monthly_income,
            "total_hostelers": total_hostelers
        })
    return results

def get_super_admin_stats(db: Session) -> dict:
    """Fetch aggregated metrics directly from central and tenant databases."""
    from sqlalchemy import create_engine, text
    
    # 1. Count hostels and owners in central DB
    hostels_count = db.query(Hostel).filter(Hostel.is_deleted == False).count()
    owners_count = db.query(Owner).filter(Owner.is_deleted == False).count()
    
    total_occupied_beds = 0
    total_monthly_revenue = 0.0
    
    # 2. Get connection strings for all tenant databases
    tenant_dbs = db.query(TenantDatabase).all()
    
    now = datetime.utcnow()
    start_of_month = datetime(now.year, now.month, 1).date()
    
    for t_db in tenant_dbs:
        db_url = f"postgresql://{t_db.db_username}:{t_db.db_password_hash}@{t_db.db_host}:{t_db.db_port}/{t_db.db_name}"
        try:
            engine = create_engine(db_url)
            with engine.connect() as conn:
                # Count occupied beds
                beds_res = conn.execute(text("SELECT COUNT(*) FROM room_assignments WHERE is_active = true AND transferred_date IS NULL")).scalar()
                total_occupied_beds += (beds_res or 0)
                
                # Sum monthly revenue (income)
                rev_res = conn.execute(
                    text("SELECT SUM(amount) FROM income WHERE payment_date >= :start"),
                    {"start": start_of_month}
                ).scalar()
                if rev_res is not None:
                    total_monthly_revenue += float(rev_res)
        except Exception as e:
            logger.error(f"Error querying tenant database {t_db.db_name} for dashboard metrics: {e}")
            
    return {
        "total_hostels": hostels_count,
        "total_owners": owners_count,
        "occupied_beds": total_occupied_beds,
        "monthly_revenue": total_monthly_revenue
    }
