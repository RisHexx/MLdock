from pydantic import BaseModel, ConfigDict, Field
#Every Pydantic model inherits from BaseModel.
#Used to configure how the model behaves.
#Adds validation rules.

from datetime import datetime


class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    #... means this field is required


class APIKeyResponse(BaseModel):
    #Every Pydantic model has some settings that control its behavior. that presnt in model_config
    model_config = ConfigDict(from_attributes=True)
    #from_attributes=True → Pydantic can also accept objects not only dict and reads their attributes

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
