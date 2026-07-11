import logging
import redis
import random
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.db_models import SuperAdmin, Owner
from app.schemas.api_schemas import (
    LoginRequest, PasswordChangeRequest, 
    ForgotPasswordRequest, ResetPasswordRequest, OTPLoginRequest
)
from app.core.email_helper import send_otp_email

logger = logging.getLogger(__name__)

# Initialize Redis client connection
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception as e:
    logger.warning(f"Could not connect to Redis broker: {e}. Rate limiter will bypass.")
    redis_client = None

def get_failed_attempts_key(email: str) -> str:
    return f"failed_attempts:{email.lower()}"

def check_failed_attempts(email: str):
    """Check if the user has exceeded the maximum allowed failed login attempts."""
    if not redis_client:
        return
    
    key = get_failed_attempts_key(email)
    attempts = redis_client.get(key)
    if attempts and int(attempts) >= settings.MAX_FAILED_ATTEMPTS:
        ttl = redis_client.ttl(key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "ACCOUNT_TEMPORARILY_LOCKED",
                "message": f"Too many failed login attempts. Please try again after {ttl // 60 + 1} minutes."
            }
        )

def increment_failed_attempts(email: str):
    """Increment the failed attempts counter in Redis."""
    if not redis_client:
        return
    
    key = get_failed_attempts_key(email)
    attempts = redis_client.incr(key)
    if attempts == 1:
        redis_client.expire(key, settings.LOCKOUT_DURATION_SECONDS)

def reset_failed_attempts(email: str):
    """Delete the failed attempts key from Redis upon successful login."""
    if not redis_client:
        return
    key = get_failed_attempts_key(email)
    redis_client.delete(key)

def login_user(db: Session, request: LoginRequest) -> dict:
    """Authenticate Super Admin or Owner account and issue a JWT token."""
    email_clean = request.email.lower()
    
    # 1. Check Redis rate limit brute-force status
    check_failed_attempts(email_clean)
    
    # 2. Check if Super Admin
    super_admin = db.query(SuperAdmin).filter(SuperAdmin.email == email_clean).first()
    if super_admin:
        if verify_password(request.password, super_admin.password_hash):
            reset_failed_attempts(email_clean)
            token = create_access_token(subject=super_admin.id, role="SUPER_ADMIN")
            return {
                "token": token,
                "force_reset": super_admin.force_password_reset,
                "role": "SUPER_ADMIN"
            }
        
    # 3. Check if Owner
    owner = db.query(Owner).filter(Owner.email == email_clean, Owner.is_deleted == False).first()
    if owner:
        # Check active status
        if not owner.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated. Please contact the administrator."
            )
        
        if verify_password(request.password, owner.password_hash):
            reset_failed_attempts(email_clean)
            token = create_access_token(subject=owner.id, role="OWNER")
            return {
                "token": token,
                "force_reset": owner.force_password_reset,
                "role": "OWNER"
            }
            
    # 4. Authentication failed: increment failed counters
    increment_failed_attempts(email_clean)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password."
    )

def change_user_password(db: Session, current_user_id: str, role: str, request: PasswordChangeRequest):
    """Change the authenticated user's password and clear force reset flags."""
    if role == "SUPER_ADMIN":
        user = db.query(SuperAdmin).filter(SuperAdmin.id == current_user_id).first()
    else:
        user = db.query(Owner).filter(Owner.id == current_user_id).first()
        
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if not verify_password(request.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password incorrect")
        
    user.password_hash = get_password_hash(request.new_password)
    user.force_password_reset = False
    db.commit()
    return {"message": "Password changed successfully"}

# --- OTP Business Logic Implementations ---

def request_forgot_password_otp(db: Session, request: ForgotPasswordRequest) -> dict:
    """Validate user email, generate a 6-digit OTP, store in Redis, and send via email."""
    email_clean = request.email.lower()
    
    # Check if user exists in Super Admin or Owner tables
    super_admin = db.query(SuperAdmin).filter(SuperAdmin.email == email_clean).first()
    owner = db.query(Owner).filter(Owner.email == email_clean, Owner.is_deleted == False).first()
    
    if not super_admin and not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account with this email address does not exist."
        )
        
    # Generate 6-digit OTP code
    otp_code = str(random.randint(100000, 999999))
    
    # Store OTP in Redis (valid for 5 minutes / 300 seconds)
    if redis_client:
        redis_key = f"reset_otp:{email_clean}"
        redis_client.set(redis_key, otp_code, ex=300)
    else:
        logger.warning("Redis client offline. Cannot cache password reset OTP.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Caching service offline. Please try again later."
        )
        
    # Send via SMTP mail relay
    send_otp_email(email_clean, otp_code, purpose="password reset")
    
    return {"message": "OTP has been sent to your registered email address."}

def verify_reset_password_otp(db: Session, request: ResetPasswordRequest) -> dict:
    """Verify reset OTP code from Redis and overwrite user password."""
    email_clean = request.email.lower()
    redis_key = f"reset_otp:{email_clean}"
    
    if not redis_client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Caching service offline. Cannot verify OTP."
        )
        
    saved_otp = redis_client.get(redis_key)
    if not saved_otp or saved_otp != request.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification OTP code."
        )
        
    # Fetch user account
    super_admin = db.query(SuperAdmin).filter(SuperAdmin.email == email_clean).first()
    owner = db.query(Owner).filter(Owner.email == email_clean, Owner.is_deleted == False).first()
    
    user = super_admin or owner
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")
        
    # Update password and disable force password reset flags
    user.password_hash = get_password_hash(request.new_password)
    user.force_password_reset = False
    db.commit()
    
    # Invalidate OTP key in Redis
    redis_client.delete(redis_key)
    
    return {"message": "Password reset successfully. You can now login with your new credentials."}

def request_login_otp(db: Session, email: str) -> dict:
    """Generate passwordless login OTP code, store in Redis, and send email (Owner only)."""
    email_clean = email.lower()
    
    owner = db.query(Owner).filter(Owner.email == email_clean, Owner.is_deleted == False).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active owner account with this email does not exist."
        )
        
    if not owner.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner account has been deactivated."
        )
        
    otp_code = str(random.randint(100000, 999999))
    
    if redis_client:
        redis_key = f"login_otp:{email_clean}"
        redis_client.set(redis_key, otp_code, ex=300)
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Caching service offline."
        )
        
    send_otp_email(email_clean, otp_code, purpose="passwordless login")
    return {"message": "Verification OTP has been sent to your email address."}

def verify_login_otp(db: Session, request: OTPLoginRequest) -> dict:
    """Verify login OTP code and issue JWT token (Owner only)."""
    email_clean = request.email.lower()
    redis_key = f"login_otp:{email_clean}"
    
    if not redis_client:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Caching service offline.")
        
    saved_otp = redis_client.get(redis_key)
    if not saved_otp or saved_otp != request.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification OTP code."
        )
        
    owner = db.query(Owner).filter(Owner.email == email_clean, Owner.is_deleted == False).first()
    if not owner or not owner.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner account is suspended or deleted.")
        
    # Generate Owner JWT token
    token = create_access_token(subject=owner.id, role="OWNER")
    
    # Invalidate OTP in Redis
    redis_client.delete(redis_key)
    reset_failed_attempts(email_clean)
    
    return {
        "token": token,
        "force_reset": owner.force_password_reset,
        "role": "OWNER"
    }

