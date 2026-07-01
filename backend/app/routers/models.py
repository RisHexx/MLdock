from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.ml_model import ModelResponse, ModelListResponse, ModelStatusUpdate
from app.services.model_service import (
    upload_model, list_models, get_model, delete_model, toggle_model_status
)
from app.services.prediction_service import unload_model

router = APIRouter(prefix="/models", tags=["Models"])


@router.post("/upload", response_model=ModelResponse)
def upload(
    pkl_file: UploadFile = File(..., alias="model_file"),
    metadata_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a model file and metadata.json."""
    ml_model = upload_model(db, pkl_file, metadata_file)
    return ModelResponse(
        id=str(ml_model.id),
        name=ml_model.name,
        display_name=ml_model.display_name,
        description=ml_model.description,
        framework=ml_model.framework,
        input_schema=ml_model.input_schema,
        output_schema=ml_model.output_schema,
        status=ml_model.status,
        version=ml_model.version,
        created_at=ml_model.created_at,
        updated_at=ml_model.updated_at,
    )


@router.get("", response_model=ModelListResponse)
def get_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all models."""
    models = list_models(db)
    return ModelListResponse(
        models=[
            ModelResponse(
                id=str(m.id),
                name=m.name,
                display_name=m.display_name,
                description=m.description,
                framework=m.framework,
                input_schema=m.input_schema,
                output_schema=m.output_schema,
                status=m.status,
                version=m.version,
                created_at=m.created_at,
                updated_at=m.updated_at,
            )
            for m in models
        ],
        total=len(models),
    )


@router.get("/{model_id}", response_model=ModelResponse)
def get_model_detail(
    model_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single model's details."""
    model = get_model(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return ModelResponse(
        id=str(model.id),
        name=model.name,
        display_name=model.display_name,
        description=model.description,
        framework=model.framework,
        input_schema=model.input_schema,
        output_schema=model.output_schema,
        status=model.status,
        version=model.version,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


@router.delete("/{model_id}")
def remove_model(
    model_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a model and its files."""
    model = get_model(db, model_id)
    if model:
        unload_model(model.name)
    success = delete_model(db, model_id)
    if not success:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"detail": "Model deleted"}


@router.patch("/{model_id}/status", response_model=ModelResponse)
def update_status(
    model_id: str,
    request: ModelStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Enable or disable a model."""
    model = toggle_model_status(db, model_id, request.status)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Unload if disabled
    if request.status == "inactive":
        unload_model(model.name)

    return ModelResponse(
        id=str(model.id),
        name=model.name,
        display_name=model.display_name,
        description=model.description,
        framework=model.framework,
        input_schema=model.input_schema,
        output_schema=model.output_schema,
        status=model.status,
        version=model.version,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )
