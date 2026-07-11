from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_admin_db
from app.core.security import get_current_user
from app.schemas.api_schemas import (
    LoginRequest, LoginResponse, PasswordChangeRequest, 
    ForgotPasswordRequest, ResetPasswordRequest, OTPLoginRequest
)
from app.controllers.auth_controller import (
    login_user, change_user_password, request_forgot_password_otp, 
    verify_reset_password_otp, request_login_otp, verify_login_otp
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_admin_db)):
    """Authenticate User and generate JWT access tokens."""
    return login_user(db, request)

@router.post("/change-password")
def change_password(
    request: PasswordChangeRequest, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_admin_db)
):
    """Force reset/change active user's credentials."""
    return change_user_password(
        db=db, 
        current_user_id=current_user["sub"], 
        role=current_user["role"], 
        request=request
    )

@router.post("/forgot-password", status_code=200)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_admin_db)):
    """Request a password reset OTP code (sent via email)."""
    return request_forgot_password_otp(db, request)

@router.post("/reset-password", status_code=200)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_admin_db)):
    """Verify reset OTP and overwrite password."""
    return verify_reset_password_otp(db, request)

@router.post("/login-otp/request", status_code=200)
def request_login_code(email: str = Query(..., description="Registered owner email"), db: Session = Depends(get_admin_db)):
    """Request a passwordless verification login OTP code (sent via email)."""
    return request_login_otp(db, email)

@router.post("/login-otp/verify", response_model=LoginResponse, status_code=200)
def verify_login_code(request: OTPLoginRequest, db: Session = Depends(get_admin_db)):
    """Authenticate and issue JWT token using passwordless login OTP."""
    return verify_login_otp(db, request)

