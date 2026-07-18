from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID

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
                "detail": "Validation failed: 'email' value is not a valid email address: An email address must have an @-sign."
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
                "service": "auth_service"
            }
        }
    }

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "superadmin@hostelmint.com",
                "password": "SecurePassword123"
            }
        }
    }

class LoginResponse(BaseModel):
    token: str
    force_reset: bool
    role: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkODQ3MWFjMSIsImZvcmNlX3Jlc2V0Ijp0cnVlLCJyb2xlIjoiT1dORVIifQ...",
                "force_reset": True,
                "role": "OWNER"
            }
        }
    }

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

    model_config = {
        "json_schema_extra": {
            "example": {
                "current_password": "HMint@xwZ^yy",
                "new_password": "SecurePermanentPassword123"
            }
        }
    }

class OwnerCreateRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    password: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "alex.mercer@hostelmint.com",
                "name": "Alex Mercer",
                "phone": "+919900112233",
                "password": "SecurePassword123"
            }
        }
    }

class OwnerCreateResponse(BaseModel):
    id: UUID
    email: str
    temp_password: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "e4b21d89-9a7c-47bc-8a21-987d1a293b8e",
                "email": "alex.mercer@hostelmint.com",
                "temp_password": "HMint@xwZ^yy"
            }
        }
    }

class StatusChangeRequest(BaseModel):
    action: str = Field(..., pattern="^(enable|disable|reset_password)$")

    model_config = {
        "json_schema_extra": {
            "example": {
                "action": "disable"
            }
        }
    }

class HostelCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    address: str = Field(..., min_length=5)
    contact_number: str = Field(..., min_length=10, max_length=20)
    floors_count: int = Field(..., gt=0)
    rooms_count: int = Field(..., gt=0)
    owner_email: Optional[EmailStr] = None
    image_url: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "HostelMint Elite Bangalore",
                "address": "45 Outer Ring Road, Bellandur, Bangalore - 560103",
                "contact_number": "+918045678901",
                "floors_count": 3,
                "rooms_count": 30,
                "image_url": "https://hostelmint.com/image.jpg"
            }
        }
    }
class HostelUpdateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    address: str = Field(..., min_length=5)
    contact_number: str = Field(..., min_length=10, max_length=20)
    floors_count: int = Field(..., gt=0)
    rooms_count: int = Field(..., gt=0)
    owner_email: Optional[EmailStr] = None
    image_url: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "HostelMint Elite Bangalore",
                "address": "45 Outer Ring Road, Bellandur, Bangalore - 560103",
                "contact_number": "+918045678901",
                "floors_count": 3,
                "rooms_count": 30,
                "owner_email": "owner@hostelmint.com",
                "image_url": "https://hostelmint.com/image.jpg"
            }
        }
    }

class HostelCreateResponse(BaseModel):
    hostel_id: UUID
    db_name: str
    status: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "hostel_id": "8def49bf-94ab-4067-a2ca-8a6c8dad0ba9",
                "db_name": "hostelmint_hostel_8def49bf_db",
                "status": "provisioned"
            }
        }
    }

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

class OwnerResponse(BaseModel):
    id: UUID
    email: str
    name: str
    phone: str
    is_active: bool

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "e4b21d89-9a7c-47bc-8a21-987d1a293b8e",
                "email": "alex.mercer@hostelmint.com",
                "name": "Alex Mercer",
                "phone": "+919900112233",
                "is_active": True
            }
        }
    }

class PaginatedOwnersResponse(BaseModel):
    data: List[OwnerResponse]
    pagination: PaginationMeta

    model_config = {
        "json_schema_extra": {
            "example": {
                "data": [
                    {
                        "id": "e4b21d89-9a7c-47bc-8a21-987d1a293b8e",
                        "email": "alex.mercer@hostelmint.com",
                        "name": "Alex Mercer",
                        "phone": "+919900112233",
                        "is_active": True
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

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "alex.mercer@hostelmint.com"
            }
        }
    }

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "alex.mercer@hostelmint.com",
                "otp": "654321",
                "new_password": "SecurePermanentPassword123"
            }
        }
    }

class OTPLoginRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "alex.mercer@hostelmint.com",
                "otp": "123456"
            }
        }
    }

class OwnerDetailsResponse(BaseModel):
    id: UUID
    email: str
    name: str
    phone: str
    is_active: bool
    hostels_assigned: List[UUID]

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "e8381d64-e83c-41c3-ab0b-47e289bf4101",
                "email": "john.doe@email.com",
                "name": "John Doe",
                "phone": "+919876543210",
                "is_active": True,
                "hostels_assigned": ["a9018c64-41c3-e83c-ab0b-47e289bf4055"]
            }
        }
    }

class HostelDetailsResponse(BaseModel):
    id: UUID
    name: str
    address: str
    contact_number: str
    floors_count: int
    rooms_count: int
    is_active: bool
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    image_url: Optional[str] = None
    occupied_beds: Optional[int] = 0
    monthly_income: Optional[float] = 0.0
    total_hostelers: Optional[int] = 0

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "a9018c64-41c3-e83c-ab0b-47e289bf4055",
                "name": "Elite Co-Living",
                "address": "45, Outer Ring Rd, Bangalore",
                "contact_number": "+918045678901",
                "floors_count": 4,
                "rooms_count": 40,
                "is_active": True,
                "owner_name": "John Doe",
                "owner_email": "john.doe@email.com",
                "owner_phone": "+919876543210"
            }
        }
    }

class UserProfileResponse(BaseModel):
    id: UUID
    email: str
    name: str
    phone: str
    role: str
    hostels_assigned: List[UUID]

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "e8381d64-e83c-41c3-ab0b-47e289bf4101",
                "email": "owner@hostelmint.com",
                "name": "Alex Mercer",
                "phone": "+919900112233",
                "role": "owner",
                "hostels_assigned": ["a9018c64-41c3-e83c-ab0b-47e289bf4055"]
            }
        }
    }

class DashboardStatsResponse(BaseModel):
    total_hostels: int
    total_owners: int
    occupied_beds: int
    monthly_revenue: float

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_hostels": 5,
                "total_owners": 3,
                "occupied_beds": 10,
                "monthly_revenue": 150000.0
            }
        }
    }
