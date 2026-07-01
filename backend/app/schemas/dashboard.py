from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_models: int
    active_models: int
    loaded_models: int
    total_api_keys: int
    total_predictions: int
    memory_usage_mb: float
