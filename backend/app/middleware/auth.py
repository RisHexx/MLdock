import uuid
from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
#Only imported for type hints.
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_token
from app.services.key_service import validate_api_key


#That object reads Authorization: Bearer abc123
# auto_error=False so a missing/malformed header gives 401 (not FastAPI's default 403),
# which is what the frontend's axios interceptor listens for to redirect to /login.
security = HTTPBearer(auto_error=False)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=401,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


#HTTPAuthorizationCredentials is a A simple container with:
# scheme -> Bearer
# credentials -> actual Token

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """JWT authentication dependency for dashboard routes."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized("Not authenticated")

    payload = decode_token(credentials.credentials)
    if payload is None:
        raise _unauthorized("Invalid or expired token")

    # sub must be a valid UUID; otherwise querying the UUID column would raise a 500.
    try:
        user_id = uuid.UUID(str(payload.get("sub")))
    except (ValueError, TypeError):
        raise _unauthorized("Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise _unauthorized("User not found")

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
