from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

# --- Room Schemas ---
class RoomCreateRequest(BaseModel):
    room_number: str = Field(..., min_length=1, max_length=20)
    floor: int = Field(..., ge=0)
    room_type: str = Field(..., pattern="^(single|double|triple|dormitory)$")
    capacity: int = Field(..., ge=1, le=100) # Enforces room capacity
    monthly_rent: Decimal = Field(..., gt=0.00) # Enforces strictly positive rent amount

class RoomResponse(BaseModel):
    id: UUID
    room_number: str
    floor: int
    room_type: str
    capacity: int
    monthly_rent: Decimal
    created_at: datetime

    class Config:
        from_attributes = True

class RoomAssignmentRequest(BaseModel):
    hosteler_id: UUID
    room_id: UUID
    bed_number: int = Field(..., ge=1)
    assigned_date: date

class RoomTransferRequest(BaseModel):
    hosteler_id: UUID
    new_room_id: UUID
    new_bed_number: int = Field(..., ge=1)

# --- Hosteler Schemas ---
class HostelerCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    permanent_address: str = Field(..., min_length=5)
    emergency_contact_name: str = Field(..., min_length=1, max_length=100)
    emergency_contact_phone: str = Field(..., min_length=10, max_length=20)
    date_of_joining: date
    photo_key: Optional[str] = None
    aadhaar_front_key: Optional[str] = None
    aadhaar_back_key: Optional[str] = None

class HostelerResponse(BaseModel):
    id: UUID
    name: str
    phone: str
    email: Optional[str] = None
    permanent_address: str
    emergency_contact_name: str
    emergency_contact_phone: str
    date_of_joining: date
    date_of_vacating: Optional[date] = None
    vacate_reason: Optional[str] = None
    is_active: bool
    photo_url: Optional[str] = None
    aadhaar_front_url: Optional[str] = None
    aadhaar_back_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class HostelerEditRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    permanent_address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    is_active: Optional[bool] = None
    date_of_vacating: Optional[date] = None
    vacate_reason: Optional[str] = None

# --- Pagination Schemas ---
class PaginationMeta(BaseModel):
    total_records: int
    current_page: int
    limit: int
    total_pages: int

class PaginatedHostelersResponse(BaseModel):
    data: List[HostelerResponse]
    pagination: PaginationMeta
