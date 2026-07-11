import logging
import redis
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.db_models import SuperAdmin, Owner
from app.schemas.api_schemas import LoginRequest, PasswordChangeRequest

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
