import time
import joblib
import numpy as np
import psutil
from typing import Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.ml_model import MLModel
from app.models.prediction_log import PredictionLog

# In-memory cache of loaded models
_loaded_models: dict[str, Any] = {}


def get_loaded_model_count() -> int:
    return len(_loaded_models)


def get_memory_usage_mb() -> float:
    """Get current process memory usage in MB."""
    process = psutil.Process()
    return round(process.memory_info().rss / (1024 * 1024), 2)


def _load_model(model: MLModel) -> Any:
    """Lazy load a model into memory."""
    if model.name in _loaded_models:
        return _loaded_models[model.name]

    try:
        loaded = joblib.load(model.file_path)
        _loaded_models[model.name] = loaded
        return loaded
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")


def unload_model(model_name: str):
    """Remove a model from the cache."""
    _loaded_models.pop(model_name, None)


def _validate_input(input_data: dict, input_schema: dict) -> list[str]:
    """Validate input against the model's input schema. Returns list of errors."""
    errors = []
    type_map = {
        "integer": int,
        "float": (int, float),
        "string": str,
        "boolean": bool,
    }

    for field, expected_type_str in input_schema.items():
        if field not in input_data:
            errors.append(f"Missing required field: '{field}'")
            continue

        value = input_data[field]
        expected_types = type_map.get(expected_type_str)
        if expected_types and not isinstance(value, expected_types):
            errors.append(
                f"Field '{field}' expected type '{expected_type_str}', got '{type(value).__name__}'"
            )

    return errors


def predict(db: Session, model: MLModel, input_data: dict) -> dict:
    """Run prediction with validation, lazy loading, and logging."""

    # 1. Validate input
    errors = _validate_input(input_data, model.input_schema)
    if errors:
        # Log the failed request
        log = PredictionLog(
            model_id=model.id,
            model_name=model.name,
            status_code=400,
            latency_ms=0,
        )
        db.add(log)
        db.commit()
        raise HTTPException(status_code=400, detail={"validation_errors": errors})

    # 2. Load model (lazy)
    loaded_model = _load_model(model)

    # 3. Run prediction
    start = time.time()
    try:
        # Build feature array in schema order
        features = []
        for field in model.input_schema.keys():
            features.append(input_data[field])

        prediction_result = loaded_model.predict([features])

        # Convert numpy types to native Python
        if isinstance(prediction_result, np.ndarray):
            prediction_result = prediction_result.tolist()

        latency_ms = round((time.time() - start) * 1000, 2)

        # 4. Log success
        log = PredictionLog(
            model_id=model.id,
            model_name=model.name,
            status_code=200,
            latency_ms=latency_ms,
        )
        db.add(log)
        db.commit()

        # Build response based on output_schema
        output_keys = list(model.output_schema.keys())
        if isinstance(prediction_result, list) and len(prediction_result) == 1:
            if isinstance(prediction_result[0], list):
                result = {
                    output_keys[i]: prediction_result[0][i]
                    for i in range(min(len(output_keys), len(prediction_result[0])))
                }
            else:
                result = {output_keys[0]: prediction_result[0]}
        else:
            result = {output_keys[0]: prediction_result}

        return {
            "model": model.name,
            "prediction": result,
            "latency_ms": latency_ms,
        }

    except HTTPException:
        raise
    except Exception as e:
        latency_ms = round((time.time() - start) * 1000, 2)
        log = PredictionLog(
            model_id=model.id,
            model_name=model.name,
            status_code=500,
            latency_ms=latency_ms,
        )
        db.add(log)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
