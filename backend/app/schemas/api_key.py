from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class APIKeyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    key_prefix: str
    is_active: bool
    created_at: datetime


class APIKeyCreated(BaseModel):
    """Returned only on creation — contains the full key (shown once)."""
    id: str
    name: str
    key: str
    key_prefix: str
    created_at: datetime
