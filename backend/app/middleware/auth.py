from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
#Only imported for type hints.
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_token
from app.services.key_service import validate_api_key


#That object reads Authorization: Bearer abc123
security = HTTPBearer()


#HTTPAuthorizationCredentials is a A simple container with:
# scheme -> Bearer
# credentials -> actual Token

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """JWT authentication dependency for dashboard routes."""
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user


#Header() is similar to Depends()
#Instead of saying Call another function" it says "Read this value from the HTTP headers.
def verify_api_key(
    #The ... (Ellipsis) means the header is required.
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> bool:
    """API key authentication dependency for prediction routes."""
    if not validate_api_key(db, x_api_key):
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")
    return True
