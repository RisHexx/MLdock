from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.ml_model import MLModel
from app.models.api_key import APIKey
from app.models.prediction_log import PredictionLog
from app.schemas.dashboard import DashboardStats
from app.services.prediction_service import get_loaded_model_count, get_memory_usage_mb

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dashboard statistics."""
    total_models = db.query(MLModel).count()
    active_models = db.query(MLModel).filter(MLModel.status == "active").count()
    total_api_keys = db.query(APIKey).count()
    total_predictions = db.query(PredictionLog).count()

    return DashboardStats(
        total_models=total_models,
        active_models=active_models,
        loaded_models=get_loaded_model_count(),
        total_api_keys=total_api_keys,
        total_predictions=total_predictions,
        memory_usage_mb=get_memory_usage_mb(),
    )
