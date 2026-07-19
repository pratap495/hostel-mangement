from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

class SuccessResponse(BaseModel):
    message: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "Operation completed successfully."
            }
        }
    }

class ErrorResponse(BaseModel):
    detail: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "detail": "Validation failed: 'room_number' is required."
            }
        }
    }

class HealthResponse(BaseModel):
    status: str
    service: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "healthy",
                "service": "hostel_service"
            }
        }
    }

class PresignedUploadResponse(BaseModel):
    upload_url: str
    fields: dict
    file_key: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "upload_url": "http://minio-storage:9000/hostelmint-secure-vault",
                "fields": {
                    "key": "uploads/aadhaar.pdf",
                    "Content-Type": "application/pdf"
                },
                "file_key": "uploads/aadhaar.pdf"
            }
        }
    }

class RoomAssignmentResponse(BaseModel):
    id: UUID
    hosteler_id: UUID
    room_id: UUID
    bed_number: int
    assigned_date: date
    is_active: bool

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "e4b21d89-9a7c-47bc-8a21-987d1a293b8e",
                "hosteler_id": "a2e7f496-7f3c-493c-82ab-5de9d5770ac1",
                "room_id": "c3438ddb-730c-4395-ba60-5a8222390386",
                "bed_number": 1,
                "assigned_date": "2026-07-13",
                "is_active": True
            }
        }
    }

class RoomActionResponse(BaseModel):
    room_id: UUID
    status: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "room_id": "c3438ddb-730c-4395-ba60-5a8222390386",
                "status": "soft_deleted"
            }
        }
    }

class HostelerActionResponse(BaseModel):
    hosteler_id: UUID
    status: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "hosteler_id": "a2e7f496-7f3c-493c-82ab-5de9d5770ac1",
                "status": "soft_deleted"
            }
        }
    }

# --- Room Schemas ---
class RoomCreateRequest(BaseModel):
    room_number: str = Field(..., min_length=1, max_length=20)
    floor: int = Field(..., ge=0)
    room_type: str = Field(..., pattern="^(single|double|triple|dormitory)$")
    capacity: int = Field(..., ge=1, le=100) # Enforces room capacity
    monthly_rent: Decimal = Field(..., gt=0.00) # Enforces strictly positive rent amount

    model_config = {
        "json_schema_extra": {
            "example": {
                "room_number": "202",
                "floor": 2,
                "room_type": "double",
                "capacity": 2,
                "monthly_rent": 6000.00
            }
        }
    }

class RoomResponse(BaseModel):
    id: UUID
    room_number: str
    floor: int
    room_type: str
    capacity: int
    monthly_rent: Decimal
    occupiedCount: int = 0
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "c3438ddb-730c-4395-ba60-5a8222390386",
                "room_number": "202",
                "floor": 2,
                "room_type": "double",
                "capacity": 2,
                "monthly_rent": 6000.00,
                "created_at": "2026-07-13T21:40:00Z"
            }
        }
    }

class RoomAssignmentRequest(BaseModel):
    hosteler_id: UUID
    room_id: UUID
    bed_number: int = Field(..., ge=1)
    assigned_date: date

    model_config = {
        "json_schema_extra": {
            "example": {
                "hosteler_id": "a2e7f496-7f3c-493c-82ab-5de9d5770ac1",
                "room_id": "c3438ddb-730c-4395-ba60-5a8222390386",
                "bed_number": 1,
                "assigned_date": "2026-07-13"
            }
        }
    }

class RoomTransferRequest(BaseModel):
    hosteler_id: UUID
    new_room_id: UUID
    new_bed_number: int = Field(..., ge=1)

    model_config = {
        "json_schema_extra": {
            "example": {
                "hosteler_id": "a2e7f496-7f3c-493c-82ab-5de9d5770ac1",
                "new_room_id": "e4b21d89-9a7c-47bc-8a21-987d1a293b8e",
                "new_bed_number": 2
            }
        }
    }

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

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Resident A",
                "phone": "+919900887766",
                "email": "resident.a@gmail.com",
                "permanent_address": "Flat 302, Green Glen Layout, Bangalore",
                "emergency_contact_name": "Emergency Name",
                "emergency_contact_phone": "+919900000000",
                "date_of_joining": "2026-07-13",
                "photo_key": "uploads/resident_a_photo.jpg",
                "aadhaar_front_key": "uploads/resident_a_aadhaar_front.jpg",
                "aadhaar_back_key": "uploads/resident_a_aadhaar_back.jpg"
            }
        }
    }

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
    room_id: Optional[UUID] = None
    bed_number: Optional[int] = None
    is_rent_overdue: bool = False
    rent_amount_due: Decimal = Decimal("0.00")
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "a2e7f496-7f3c-493c-82ab-5de9d5770ac1",
                "name": "Resident A",
                "phone": "+919900887766",
                "email": "resident.a@gmail.com",
                "permanent_address": "Flat 302, Green Glen Layout, Bangalore",
                "emergency_contact_name": "Emergency Name",
                "emergency_contact_phone": "+919900000000",
                "date_of_joining": "2026-07-13",
                "date_of_vacating": None,
                "vacate_reason": None,
                "is_active": True,
                "photo_url": "http://localhost/api/v1/storage/download/photo.jpg",
                "aadhaar_front_url": "http://localhost/api/v1/storage/download/front.jpg",
                "aadhaar_back_url": "http://localhost/api/v1/storage/download/back.jpg",
                "created_at": "2026-07-13T21:40:00Z"
            }
        }
    }

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
    photo_key: Optional[str] = None
    aadhaar_front_key: Optional[str] = None
    aadhaar_back_key: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Resident A Updated",
                "phone": "+919900887755",
                "email": "resident.a.new@gmail.com",
                "is_active": True
            }
        }
    }

# --- Pagination Schemas ---
class PaginationMeta(BaseModel):
    total_records: int
    current_page: int
    limit: int
    total_pages: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_records": 45,
                "current_page": 1,
                "limit": 10,
                "total_pages": 5
            }
        }
    }

class PaginatedHostelersResponse(BaseModel):
    data: List[HostelerResponse]
    pagination: PaginationMeta

    model_config = {
        "json_schema_extra": {
            "example": {
                "data": [
                    {
                        "id": "a2e7f496-7f3c-493c-82ab-5de9d5770ac1",
                        "name": "Resident A",
                        "phone": "+919900887766",
                        "email": "resident.a@gmail.com",
                        "permanent_address": "Flat 302, Green Glen Layout, Bangalore",
                        "emergency_contact_name": "Emergency Name",
                        "emergency_contact_phone": "+919900000000",
                        "date_of_joining": "2026-07-13",
                        "date_of_vacating": None,
                        "vacate_reason": None,
                        "is_active": True,
                        "photo_url": "http://localhost/api/v1/storage/download/photo.jpg",
                        "aadhaar_front_url": "http://localhost/api/v1/storage/download/front.jpg",
                        "aadhaar_back_url": "http://localhost/api/v1/storage/download/back.jpg",
                        "created_at": "2026-07-13T21:40:00Z"
                    }
                ],
                "pagination": {
                    "total_records": 1,
                    "current_page": 1,
                    "limit": 10,
                    "total_pages": 1
                }
            }
        }
    }
