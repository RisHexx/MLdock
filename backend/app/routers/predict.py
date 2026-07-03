from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import verify_api_key
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.model_manager import model_manager

router = APIRouter(prefix="/predict", tags=["Prediction"])


@router.post("/{model_name}", response_model=PredictionResponse)
def run_prediction(
    model_name: str,
    request: PredictionRequest,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_api_key),
):
    """Run a prediction on a deployed model. Requires X-API-Key header."""
    result = model_manager.predict(db, model_name, request.input)
    return PredictionResponse(**result)
