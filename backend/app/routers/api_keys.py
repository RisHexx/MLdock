from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.api_key import APIKeyCreate, APIKeyResponse, APIKeyCreated
from app.services.key_service import create_api_key, list_api_keys, revoke_api_key


#tags is mainly for documentation
router = APIRouter(prefix="/api-keys", tags=["API Keys"])

#response_model=SetupCheckResponse
#This tells FastAPI what the response should look like.
#Even if your function accidentally returns extra fields, FastAPI filters them.
@router.post("", response_model=APIKeyCreated)
def generate_key(
    request: APIKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a new API key. The full key is returned only once."""
    api_key, raw_key = create_api_key(db, request.name)
    return APIKeyCreated(
        id=str(api_key.id),
        name=api_key.name,
        key=raw_key,
        key_prefix=api_key.key_prefix,
        created_at=api_key.created_at,
    )


@router.get("", response_model=list[APIKeyResponse])
def get_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all API keys (prefix only)."""
    keys = list_api_keys(db)
    return [
        APIKeyResponse(
            id=str(k.id),
            name=k.name,
            key_prefix=k.key_prefix,
            is_active=k.is_active,
            created_at=k.created_at,
        )
        for k in keys
    ]


@router.delete("/{key_id}")
def delete_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke an API key."""
    success = revoke_api_key(db, key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"detail": "API key revoked"}
