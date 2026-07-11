from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from uuid import UUID

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    force_reset: bool
    role: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class OwnerCreateRequest(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)

class OwnerCreateResponse(BaseModel):
    id: UUID
    email: str
    temp_password: str

class StatusChangeRequest(BaseModel):
    action: str = Field(..., pattern="^(enable|disable|reset_password)$")

class HostelCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    address: str = Field(..., min_length=5)
    contact_number: str = Field(..., min_length=10, max_length=20)
    floors_count: int = Field(..., gt=0)
    rooms_count: int = Field(..., gt=0)

class HostelCreateResponse(BaseModel):
    hostel_id: UUID
    db_name: str
    status: str

# Standard paginated meta response model
class PaginationMeta(BaseModel):
    total_records: int
    current_page: int
    limit: int
    total_pages: int

class OwnerResponse(BaseModel):
    id: UUID
    email: str
    name: str
    phone: str
    is_active: bool

class PaginatedOwnersResponse(BaseModel):
    data: List[OwnerResponse]
    pagination: PaginationMeta

# --- OTP / Password Reset Schemas ---
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)

class OTPLoginRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

