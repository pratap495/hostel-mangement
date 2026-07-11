import uuid
import logging
from datetime import date, datetime
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models.db_models import Hosteler, RoomAssignment, Room
from app.schemas.api_schemas import HostelerCreateRequest, HostelerEditRequest
from app.core.s3_helper import get_presigned_download_url

logger = logging.getLogger(__name__)

def inject_presigned_urls(hosteler: Hosteler) -> Hosteler:
    """Dynamically inject short-lived S3 download URLs for photo and Aadhaar keys (Task 7.2)."""
    if hosteler:
        # Generate presigned download links valid for 120 seconds (Section 3.6)
        if hosteler.photo_url:
            hosteler.photo_url = get_presigned_download_url(hosteler.photo_url, expires_in=120)
        if hosteler.aadhaar_front_url:
            hosteler.aadhaar_front_url = get_presigned_download_url(hosteler.aadhaar_front_url, expires_in=120)
        if hosteler.aadhaar_back_url:
            hosteler.aadhaar_back_url = get_presigned_download_url(hosteler.aadhaar_back_url, expires_in=120)
    return hosteler

def register_hosteler(db: Session, request: HostelerCreateRequest) -> Hosteler:
    """Register a new Resident Profile with S3 document keys (Task 4.3)."""
    # Check active resident duplicate phone
    existing = db.query(Hosteler).filter(
        Hosteler.phone == request.phone,
        Hosteler.is_deleted == False,
        Hosteler.is_active == True
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active resident with this phone number is already registered."
        )
        
    new_hosteler = Hosteler(
        name=request.name,
        phone=request.phone,
        email=request.email,
        permanent_address=request.permanent_address,
        emergency_contact_name=request.emergency_contact_name,
        emergency_contact_phone=request.emergency_contact_phone,
        date_of_joining=request.date_of_joining,
        is_active=True,
        # Store raw keys in DB
        photo_url=request.photo_key,
        aadhaar_front_url=request.aadhaar_front_key,
        aadhaar_back_url=request.aadhaar_back_key
    )
    
    db.add(new_hosteler)
    db.commit()
    db.refresh(new_hosteler)
    return inject_presigned_urls(new_hosteler)

def edit_hosteler_profile(db: Session, hosteler_id: str, request: HostelerEditRequest) -> Hosteler:
    """Edit resident profile details. Handles vacating/deactivating logic (Task 4.2.1)."""
    hosteler = db.query(Hosteler).filter(Hosteler.id == hosteler_id, Hosteler.is_deleted == False).first()
    if not hosteler:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosteler profile not found.")
        
    update_data = request.dict(exclude_unset=True)
    
    # Handle check-out vacating logic
    if "is_active" in update_data and update_data["is_active"] is False:
        # Mark active assignment inactive
        active_assignment = db.query(RoomAssignment).filter(
            RoomAssignment.hosteler_id == hosteler_id,
            RoomAssignment.is_active == True
        ).first()
        if active_assignment:
            active_assignment.is_active = False
            active_assignment.transferred_date = update_data.get("date_of_vacating") or date.today()
            
        hosteler.date_of_vacating = update_data.get("date_of_vacating") or date.today()
        hosteler.vacate_reason = update_data.get("vacate_reason") or "Marked inactive by administrator."
        
    for key, value in update_data.items():
        setattr(hosteler, key, value)
        
    db.commit()
    db.refresh(hosteler)
    return inject_presigned_urls(hosteler)

def search_residents(
    db: Session, 
    page: int, 
    limit: int, 
    search: Optional[str] = None, 
    room_number: Optional[str] = None, 
    is_active: Optional[bool] = None,
    joining_date: Optional[date] = None
) -> dict:
    """Search and filter hostelers with offset pagination (Task 4.6 / Task 3.10)."""
    query = db.query(Hosteler).filter(Hosteler.is_deleted == False)
    
    # Filter by active status
    if is_active is not None:
        query = query.filter(Hosteler.is_active == is_active)
        
    # Search by Name or Phone
    if search:
        search_filter = f"%{search}%"
        query = query.filter(or_(Hosteler.name.ilike(search_filter), Hosteler.phone.ilike(search_filter)))
        
    # Filter by Joining Date
    if joining_date:
        query = query.filter(Hosteler.date_of_joining == joining_date)
        
    # Filter by Room Number (Requires join query)
    if room_number:
        query = query.join(RoomAssignment, RoomAssignment.hosteler_id == Hosteler.id)\
                     .join(Room, Room.id == RoomAssignment.room_id)\
                     .filter(Room.room_number == room_number, RoomAssignment.is_active == True)
                     
    # Total count for pagination
    total_records = query.count()
    total_pages = (total_records + limit - 1) // limit
    
    # Fetch paginated slice
    offset = (page - 1) * limit
    results = query.order_by(Hosteler.created_at.desc()).offset(offset).limit(limit).all()
    
    # Generate presigned download links for return payload
    final_data = [inject_presigned_urls(h) for h in results]
    
    return {
        "data": final_data,
        "pagination": {
            "total_records": total_records,
            "current_page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    }

def soft_delete_hosteler_profile(db: Session, hosteler_id: str) -> dict:
    """Soft delete resident profile and close active room bookings (Task 4.7)."""
    hosteler = db.query(Hosteler).filter(Hosteler.id == hosteler_id, Hosteler.is_deleted == False).first()
    if not hosteler:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosteler profile not found.")
        
    # Close any active room assignments
    active_assignment = db.query(RoomAssignment).filter(
        RoomAssignment.hosteler_id == hosteler_id,
        RoomAssignment.is_active == True
    ).first()
    if active_assignment:
        active_assignment.is_active = False
        active_assignment.transferred_date = date.today()
        
    hosteler.is_active = False
    hosteler.is_deleted = True
    hosteler.deleted_at = datetime.utcnow()
    db.commit()
    return {"hosteler_id": hosteler.id, "status": "soft_deleted"}

def restore_hosteler_profile(db: Session, hosteler_id: str) -> dict:
    """Restore a soft deleted hosteler profile (Task 4.7)."""
    hosteler = db.query(Hosteler).filter(Hosteler.id == hosteler_id, Hosteler.is_deleted == True).first()
    if not hosteler:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deleted hosteler profile not found.")
        
    hosteler.is_deleted = False
    hosteler.deleted_at = None
    db.commit()
    return {"hosteler_id": hosteler.id, "status": "restored"}
