from datetime import datetime, timedelta
from typing import Union, Any
import jwt
import bcrypt
from .config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against a bcrypt hash directly using bcrypt library."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Generate bcrypt hash for a plain text password directly using bcrypt library."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(subject: Union[str, Any], role: str, force_reset: bool = False, expires_delta: int = None) -> str:
    """Generate JWT access token for a subject containing roles and force reset claims."""
    if expires_delta:
        expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "force_reset": force_reset
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token."""
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return decoded_token if decoded_token["exp"] >= datetime.utcnow().timestamp() else {}
    except jwt.PyJWTError:
        return {}

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

reusable_oauth2 = HTTPBearer()

def get_current_user(request: Request, token: HTTPAuthorizationCredentials = Depends(reusable_oauth2)) -> dict:
    """Extract and validate credentials, blocking operations if first-time password reset is forced (Task 2.3)."""
    payload = decode_access_token(token.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Block all operations except change-password and system health checks if first login password reset is required (restricted to Owner role)
    if payload.get("force_reset") and payload.get("role") == "OWNER" and not (request.url.path.endswith("/change-password") or request.url.path.endswith("/health")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="FORCE_PASSWORD_RESET_REQUIRED: Please set your new password before accessing system resources."
        )
        
    return payload

