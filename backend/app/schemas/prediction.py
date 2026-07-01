from pydantic import BaseModel, ConfigDict
from typing import Any, Dict


class PredictionRequest(BaseModel):
    input: Dict[str, Any]


class PredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model: str
    prediction: Any
    latency_ms: float
