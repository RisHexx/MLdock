"""ModelManager — centralized model lifecycle management.

This is the single entry point for loading, caching, inference, and unloading
models. Controllers should call model_manager.predict() and never load models
directly.
"""


#use to measure how long prediction takes
import time
import numpy as np
#psutil lets Python inspect the current process.
import psutil
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.ml_model import MLModel
from app.models.prediction_log import PredictionLog
from app.drivers.registry import get_driver


class ModelManager:
    """Manages the full model lifecycle: load, cache, predict, unload."""

    def __init__(self) -> None:
        # model_name -> (loaded_model_object, framework_string)
        #run when we initialize this class we know as its constructor
        self._cache: dict[str, tuple[Any, str]] = {}

    # ------------------------------------------------------------------
    # Cache inspection
    # ------------------------------------------------------------------

    def get_loaded_model_count(self) -> int:
        """Return the number of models currently cached in memory."""
        return len(self._cache)

    @staticmethod
    def get_memory_usage_mb() -> float:
        """Get current process memory usage in MB."""
        process = psutil.Process()
        return round(process.memory_info().rss / (1024 * 1024), 2)

    # ------------------------------------------------------------------
    # Load / unload
    # ------------------------------------------------------------------

    def load_model(self, model: MLModel) -> Any:
        """Load a model via the appropriate driver and cache it.

        Returns the cached instance if the model is already loaded.
        """
        if model.name in self._cache:
            #  model_name -> (loaded_model_object, framework_string)
            return self._cache[model.name][0]

        driver = get_driver(model.framework)
        try:
            metadata = {
                "model_path": model.file_path,
                "framework": model.framework,
                "input_schema": model.input_schema,
                "output_schema": model.output_schema,
            }
            loaded = driver.load(metadata)
            self._cache[model.name] = (loaded, model.framework)
            return loaded
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load model '{model.name}': {str(e)}",
            )

    def unload_model(self, model_name: str) -> None:
        """Unload a model via its driver and remove from cache."""
        #finding entry by model name - model_name -> (loaded_model_object, framework_string)
        entry = self._cache.pop(model_name, None)
        if entry is not None:
            loaded_model, framework = entry
            try:
                driver = get_driver(framework)
                driver.unload(loaded_model)
            except Exception:
                pass  # Best-effort cleanup

    # ------------------------------------------------------------------
    # Input validation
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_input(input_data: dict, input_schema: dict) -> list[str]:
        """Validate input against the model's input schema. Returns errors."""
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
                    f"Field '{field}' expected type '{expected_type_str}', "
                    f"got '{type(value).__name__}'"
                )

        return errors

    # ------------------------------------------------------------------
    # Predict (the main entry point for controllers)
    # ------------------------------------------------------------------

    def predict(self, db: Session, model_name: str, input_data: dict) -> dict:
        """Full prediction pipeline: resolve, validate, load, infer, log.

        This is the only method controllers should call for inference.

        Args:
            db: Database session for model lookup and logging.
            model_name: The unique model name (URL slug).
            input_data: Dict of input fields.

        Returns:
            Dict with 'model', 'prediction', and 'latency_ms' keys.

        Raises:
            HTTPException: On model not found, disabled, validation errors,
                           or inference failure.
        """
        # 1. Resolve model from DB
        model = (
            db.query(MLModel).filter(MLModel.name == model_name).first()
        )
        if not model:
            raise HTTPException(
                status_code=404,
                detail=f"Model '{model_name}' not found",
            )

        if model.status != "active":
            raise HTTPException(
                status_code=403,
                detail=f"Model '{model_name}' is currently disabled",
            )

        # 2. Validate input
        errors = self._validate_input(input_data, model.input_schema)
        if errors:
            log = PredictionLog(
                model_id=model.id,
                model_name=model.name,
                status_code=400,
                latency_ms=0,
            )
            db.add(log)
            db.commit()
            raise HTTPException(
                status_code=400,
                detail={"validation_errors": errors},
            )

        # 3. Load model (cache hit or driver.load)
        loaded_model = self.load_model(model)

        # 4. Run inference via driver
        driver = get_driver(model.framework)
        start = time.time()
        try:
            prediction_result = driver.predict(
                loaded_model, input_data, model.input_schema
            )

            # Convert numpy types to native Python
            if isinstance(prediction_result, np.ndarray):
                prediction_result = prediction_result.tolist()

            latency_ms = round((time.time() - start) * 1000, 2)

            # 5. Log success
            log = PredictionLog(
                model_id=model.id,
                model_name=model.name,
                status_code=200,
                latency_ms=latency_ms,
            )
            db.add(log)
            db.commit()

            # 6. Build response based on output_schema
            output_keys = list(model.output_schema.keys())
            if isinstance(prediction_result, list) and len(prediction_result) == 1:
                if isinstance(prediction_result[0], list):
                    result = {
                        output_keys[i]: prediction_result[0][i]
                        for i in range(
                            min(len(output_keys), len(prediction_result[0]))
                        )
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
            raise HTTPException(
                status_code=500,
                detail=f"Prediction failed: {str(e)}",
            )


# Singleton instance — import this in routers/services
model_manager = ModelManager()
