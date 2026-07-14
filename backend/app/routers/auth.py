from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import (
    SetupRequest, LoginRequest, TokenResponse, UserResponse, SetupCheckResponse
)
from app.services.auth_service import (
    is_setup_complete, create_admin, authenticate_user, create_access_token
)
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/check", response_model=SetupCheckResponse)
def check_setup(db: Session = Depends(get_db)):
    """Check if the admin account has been set up."""
    return SetupCheckResponse(is_setup=is_setup_complete(db))

#This creates the first admin account.
@router.post("/setup", response_model=TokenResponse)
def setup_admin(request: SetupRequest, db: Session = Depends(get_db)):
    """Create the first admin account. Only works when no users exist."""
    if is_setup_complete(db):
        raise HTTPException(status_code=400, detail="Admin account already exists")

    user = create_admin(db, request.username, request.password)
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)



@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return a JWT token."""
    user = authenticate_user(db, request.username, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return UserResponse(id=str(current_user.id), username=current_user.username)
