from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_admin_db
from app.core.security import get_current_user
from app.schemas.api_schemas import LoginRequest, LoginResponse, PasswordChangeRequest
from app.controllers.auth_controller import login_user, change_user_password

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
