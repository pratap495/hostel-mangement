from datetime import datetime
from typing import Union, Any
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

reusable_oauth2 = HTTPBearer()

def decode_access_token(token: str) -> dict:
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return decoded_token if decoded_token["exp"] >= datetime.utcnow().timestamp() else {}
    except jwt.PyJWTError:
        return {}

def get_current_user(token: HTTPAuthorizationCredentials = Depends(reusable_oauth2)) -> dict:
    payload = decode_access_token(token.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if payload.get("force_reset"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="FORCE_PASSWORD_RESET_REQUIRED: Please set your new password before accessing system resources."
        )
        
    return payload

def require_owner_or_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["OWNER", "SUPER_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Dashboard owner privileges required."
        )
    return current_user
