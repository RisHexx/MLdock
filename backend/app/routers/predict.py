from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import verify_api_key
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.model_service import get_model_by_name
from app.services.prediction_service import predict

router = APIRouter(prefix="/predict", tags=["Prediction"])


@router.post("/{model_name}", response_model=PredictionResponse)
def run_prediction(
    model_name: str,
    request: PredictionRequest,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_api_key),
):
    """Run a prediction on a deployed model. Requires X-API-Key header."""
    model = get_model_by_name(db, model_name)
    if not model:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")

    if model.status != "active":
        raise HTTPException(status_code=403, detail=f"Model '{model_name}' is currently disabled")

    result = predict(db, model, request.input)
    return PredictionResponse(**result)
