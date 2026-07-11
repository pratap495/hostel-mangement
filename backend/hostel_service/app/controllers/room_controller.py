from datetime import date, datetime
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.db_models import Room, RoomAssignment, Hosteler
from app.schemas.api_schemas import RoomCreateRequest, RoomAssignmentRequest, RoomTransferRequest

def add_room(db: Session, request: RoomCreateRequest) -> Room:
    """Add a new Room to the active hostel inventory."""
    # Check if room number already exists in this hostel database context
    existing_room = db.query(Room).filter(Room.room_number == request.room_number, Room.is_deleted == False).first()
    if existing_room:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A room with this room number already exists."
        )
        
    new_room = Room(
        room_number=request.room_number,
        floor=request.floor,
        room_type=request.room_type,
        capacity=request.capacity,
        monthly_rent=request.monthly_rent
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

def allocate_bed(db: Session, request: RoomAssignmentRequest) -> RoomAssignment:
    """Allocate a bed slot to a hosteler while preventing room over-capacity (Task 4.4)."""
    room = db.query(Room).filter(Room.id == request.room_id, Room.is_deleted == False).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target room not found.")
        
    hosteler = db.query(Hosteler).filter(Hosteler.id == request.hosteler_id, Hosteler.is_deleted == False).first()
    if not hosteler:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosteler not found.")
        
    # Check if hosteler is already active in a room
    active_assignment = db.query(RoomAssignment).filter(
        RoomAssignment.hosteler_id == request.hosteler_id,
        RoomAssignment.is_active == True
    ).first()
    if active_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hosteler is already allocated to an active room. Please use room transfer instead."
        )
        
    # Prevent over-allocation: count active assignments (Task 4.4)
    active_count = db.query(RoomAssignment).filter(
        RoomAssignment.room_id == request.room_id,
        RoomAssignment.is_active == True
    ).count()
    
    if active_count >= room.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "ROOM_CAPACITY_EXCEEDED",
                "message": f"Cannot allocate bed. Room {room.room_number} capacity limit ({room.capacity}) has been reached."
            }
        )
        
    # Verify bed number is not already occupied
    bed_occupied = db.query(RoomAssignment).filter(
        RoomAssignment.room_id == request.room_id,
        RoomAssignment.bed_number == request.bed_number,
        RoomAssignment.is_active == True
    ).first()
    if bed_occupied:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bed number {request.bed_number} is already occupied in room {room.room_number}."
        )
        
    new_assignment = RoomAssignment(
        hosteler_id=request.hosteler_id,
        room_id=request.room_id,
        bed_number=request.bed_number,
        assigned_date=request.assigned_date,
        is_active=True
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

def transfer_hosteler_room(db: Session, request: RoomTransferRequest) -> RoomAssignment:
    """Execute room transfer for a hosteler inside a safe database transaction block (Task 4.5)."""
    # 1. Fetch active assignment
    current_assignment = db.query(RoomAssignment).filter(
        RoomAssignment.hosteler_id == request.hosteler_id,
        RoomAssignment.is_active == True
    ).first()
    if not current_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active room assignment found for this hosteler. Allocate a bed first."
        )
        
    # Check if target room is the same
    if current_assignment.room_id == request.new_room_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hosteler is already allocated to this target room."
        )
        
    # 2. Fetch target room and verify capacity
    target_room = db.query(Room).filter(Room.id == request.new_room_id, Room.is_deleted == False).first()
    if not target_room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target room not found.")
        
    active_count = db.query(RoomAssignment).filter(
        RoomAssignment.room_id == request.new_room_id,
        RoomAssignment.is_active == True
    ).count()
    if active_count >= target_room.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ROOM_CAPACITY_EXCEEDED"
        )
        
    # Verify bed number is not already occupied
    bed_occupied = db.query(RoomAssignment).filter(
        RoomAssignment.room_id == request.new_room_id,
        RoomAssignment.bed_number == request.new_bed_number,
        RoomAssignment.is_active == True
    ).first()
    if bed_occupied:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bed number {request.new_bed_number} is already occupied in target room."
        )
        
    today = date.today()
    
    # 3. Perform transfer using SQL Transaction
    # Mark old assignment inactive
    current_assignment.is_active = False
    current_assignment.transferred_date = today
    
    # Create new assignment
    new_assignment = RoomAssignment(
        hosteler_id=request.hosteler_id,
        room_id=request.new_room_id,
        bed_number=request.new_bed_number,
        assigned_date=today,
        is_active=True
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

def soft_delete_room(db: Session, room_id: str) -> dict:
    """Soft delete a room and set its timestamp (Task 4.7)."""
    room = db.query(Room).filter(Room.id == room_id, Room.is_deleted == False).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found.")
        
    # Check if there are active residents in the room
    has_residents = db.query(RoomAssignment).filter(
        RoomAssignment.room_id == room_id,
        RoomAssignment.is_active == True
    ).first()
    if has_residents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete room while it has active resident allocations. Transfer residents first."
        )
        
    room.is_deleted = True
    room.deleted_at = datetime.utcnow()
    db.commit()
    return {"room_id": room.id, "status": "soft_deleted"}

def restore_room_item(db: Session, room_id: str) -> dict:
    """Restore a soft deleted room (Task 4.7)."""
    room = db.query(Room).filter(Room.id == room_id, Room.is_deleted == True).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deleted room not found.")
        
    room.is_deleted = False
    room.deleted_at = None
    db.commit()
    return {"room_id": room.id, "status": "restored"}
