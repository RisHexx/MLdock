import os
import shutil
import json
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from app.config import settings
from app.models.ml_model import MLModel
from app.utils.metadata_parser import parse_and_validate_metadata
from app.drivers.registry import get_driver
from app.services.model_manager import model_manager


def upload_model(
    db: Session,
    model_file: UploadFile,
    metadata_file: UploadFile,
) -> MLModel:
    """Upload a model file and metadata, validate, store on disk, create DB record."""

    # 1. Read and validate metadata first (need framework to resolve driver)
    try:
        metadata_content = metadata_file.file.read().decode("utf-8")
        metadata = parse_and_validate_metadata(metadata_content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid metadata: {str(e)}")

    # 2. Resolve driver from framework
    framework = metadata["framework"]
    try:
        driver = get_driver(framework)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 3. Validate model file extension via driver
    if not model_file.filename:
        raise HTTPException(
            status_code=400,
            detail=f"Model file must have one of these extensions: {driver.supported_extensions()}",
        )

    _, file_ext = os.path.splitext(model_file.filename.lower())
    if file_ext not in driver.supported_extensions():
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid file extension '{file_ext}' for framework '{framework}'. "
                f"Supported: {driver.supported_extensions()}"
            ),
        )

    # 4. Validate model file size
    model_file.file.seek(0, 2)  # Seek to end
    file_size_mb = model_file.file.tell() / (1024 * 1024)
    model_file.file.seek(0)  # Seek back to start
    if file_size_mb > settings.MAX_MODEL_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"Model file is {file_size_mb:.1f} MB, exceeds limit of {settings.MAX_MODEL_SIZE_MB} MB",
        )

    # 5. Check for duplicate model name
    existing = db.query(MLModel).filter(MLModel.name == metadata["name"]).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Model '{metadata['name']}' already exists")

    # 6. Create storage directory
    model_dir = os.path.join(settings.STORAGE_PATH, metadata["name"])
    os.makedirs(model_dir, exist_ok=True)

    model_file_path = os.path.join(model_dir, f"model{file_ext}")
    metadata_file_path = os.path.join(model_dir, "metadata.json")

    try:
        # 7. Save model file to disk
        model_file.file.seek(0)
        with open(model_file_path, "wb") as f:
            shutil.copyfileobj(model_file.file, f)

        # 8. Validate model loads successfully via driver
        try:
            driver.validate_model_file(model_file_path)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to load model file: {str(e)}"
            )

        # 9. Persist model_path into metadata and save to disk
        metadata["model_path"] = model_file_path
        with open(metadata_file_path, "w") as f:
            json.dump(metadata, f, indent=2)

        # 10. Create DB record
        ml_model = MLModel(
            name=metadata["name"],
            display_name=metadata["display_name"],
            description=metadata.get("description"),
            framework=metadata["framework"],
            input_schema=metadata["input_schema"],
            output_schema=metadata["output_schema"],
            file_path=model_file_path,
            version=metadata.get("version"),
            status="active",
        )
        db.add(ml_model)
        db.commit()
        db.refresh(ml_model)
        return ml_model

    except HTTPException:
        # Clean up on validation failure
        if os.path.exists(model_dir):
            shutil.rmtree(model_dir)
        raise
    except Exception as e:
        # Clean up on unexpected failure
        if os.path.exists(model_dir):
            shutil.rmtree(model_dir)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


def list_models(db: Session) -> list[MLModel]:
    return db.query(MLModel).order_by(MLModel.created_at.desc()).all()


def get_model(db: Session, model_id: str) -> MLModel | None:
    return db.query(MLModel).filter(MLModel.id == model_id).first()


def get_model_by_name(db: Session, model_name: str) -> MLModel | None:
    return db.query(MLModel).filter(MLModel.name == model_name).first()


def delete_model(db: Session, model_id: str) -> bool:
    model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not model:
        return False

    # Unload from cache via ModelManager (driver handles resource cleanup)
    model_manager.unload_model(model.name)

    # Remove files from disk
    model_dir = os.path.join(settings.STORAGE_PATH, model.name)
    if os.path.exists(model_dir):
        shutil.rmtree(model_dir)

    db.delete(model)
    db.commit()
    return True


def toggle_model_status(db: Session, model_id: str, status: str) -> MLModel | None:
    model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not model:
        return None
    if status not in ("active", "inactive"):
        raise HTTPException(status_code=400, detail="Status must be 'active' or 'inactive'")
    model.status = status
    db.commit()
    db.refresh(model)
    return model
