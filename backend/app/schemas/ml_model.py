from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any, List


class ModelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    name: str
    display_name: str
    description: Optional[str] = None
    framework: str
    input_schema: Dict[str, str]
    output_schema: Dict[str, str]
    status: str
    version: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ModelListResponse(BaseModel):
    models: List[ModelResponse]
    total: int


class ModelStatusUpdate(BaseModel):
    status: str  # "active" or "inactive"
