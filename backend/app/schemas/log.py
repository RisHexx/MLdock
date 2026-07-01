from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional


class LogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: str
    model_name: str
    status_code: int
    latency_ms: float
    created_at: datetime


class LogListResponse(BaseModel):
    logs: List[LogEntry]
    total: int
