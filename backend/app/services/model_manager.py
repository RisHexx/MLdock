"""ModelManager — centralized model lifecycle management.

This is the single entry point for loading, caching, inference, and unloading
models. Controllers should call model_manager.predict() and never load models
directly.

Cache behaviour:
- LRU: at most settings.MAX_LOADED_MODELS models stay in memory (0 = unlimited).
  When the limit is exceeded, the least recently used model is unloaded.
- Thread-safe: FastAPI runs sync endpoints in a thread pool, so concurrent
  requests can hit the manager at the same time. A per-model lock makes sure
  a model is only loaded once even if many requests arrive together.
- Entries remember the DB id of the model they were loaded from, so a model
  that was deleted and re-uploaded under the same name is reloaded instead of
  serving the stale one.
"""


#use to measure how long prediction takes
import gc
import threading
import time
from collections import OrderedDict
from dataclasses import dataclass
from typing import Any

import numpy as np
#psutil lets Python inspect the current process.
import psutil
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.drivers.registry import get_driver
from app.models.ml_model import MLModel
from app.models.prediction_log import PredictionLog


@dataclass
class _CacheEntry:
    model: Any          # loaded, framework-specific model object
    framework: str
    model_id: str       # DB id the object was loaded from


class ModelManager:
    """Manages the full model lifecycle: load, cache, predict, unload."""

    def __init__(self, max_loaded_models: int | None = None) -> None:
        # model_name -> _CacheEntry, ordered from least to most recently used
        self._cache: "OrderedDict[str, _CacheEntry]" = OrderedDict()
        # Guards _cache and _load_locks (held only briefly, never while loading)
        self._lock = threading.Lock()
        # model_name -> lock held while that model is being loaded
        self._load_locks: dict[str, threading.Lock] = {}
        self._max_loaded = (
            settings.MAX_LOADED_MODELS if max_loaded_models is None else max_loaded_models
        )

    # ------------------------------------------------------------------
    # Cache inspection
    # ------------------------------------------------------------------

    def get_loaded_model_count(self) -> int:
        """Return the number of models currently cached in memory."""
        with self._lock:
            return len(self._cache)

    def get_loaded_model_names(self) -> list[str]:
        """Return loaded model names, least recently used first."""
        with self._lock:
            return list(self._cache.keys())

    @staticmethod
    def get_memory_usage_mb() -> float:
        """Get current process memory usage in MB."""
        process = psutil.Process()
        return round(process.memory_info().rss / (1024 * 1024), 2)

    # ------------------------------------------------------------------
    # Load / unload
    # ------------------------------------------------------------------

    def _get_cached(self, model: MLModel) -> Any | None:
        """Return the cached object for this exact model (and mark it recently used)."""
        with self._lock:
            entry = self._cache.get(model.name)
            if entry is not None and entry.model_id == str(model.id):
                self._cache.move_to_end(model.name)
                return entry.model
            return None

    def load_model(self, model: MLModel) -> Any:
        """Load a model via the appropriate driver and cache it.

        Returns the cached instance if the model is already loaded.
        """
        cached = self._get_cached(model)
        if cached is not None:
            return cached

        with self._lock:
            load_lock = self._load_locks.setdefault(model.name, threading.Lock())

        # Only one thread loads a given model; others wait here and then hit the cache.
        with load_lock:
            cached = self._get_cached(model)
            if cached is not None:
                return cached

            # A stale entry (same name, different DB id) must go before loading the new one
            self.unload_model(model.name)

            driver = get_driver(model.framework)
            try:
                loaded = driver.load({
                    "model_path": model.file_path,
                    "framework": model.framework,
                    "input_schema": model.input_schema,
                    "output_schema": model.output_schema,
                })
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to load model '{model.name}': {str(e)}",
                )

            with self._lock:
                self._cache[model.name] = _CacheEntry(loaded, model.framework, str(model.id))
                self._cache.move_to_end(model.name)
                evict = self._pick_evictions_locked(keep=model.name)

            for name in evict:
                self.unload_model(name)

            return loaded

    def _pick_evictions_locked(self, keep: str) -> list[str]:
        """Names of least-recently-used models to drop to respect the limit. Caller holds _lock."""
        if self._max_loaded <= 0:
            return []
        overflow = len(self._cache) - self._max_loaded
        if overflow <= 0:
            return []
        return [name for name in self._cache if name != keep][:overflow]

    def unload_model(self, model_name: str) -> None:
        """Unload a model via its driver and remove from cache."""
        with self._lock:
            entry = self._cache.pop(model_name, None)
            if entry is None:
                return
            framework = entry.framework
            # Only reset framework-wide state if no other model of this framework is still loaded
            framework_still_used = any(e.framework == framework for e in self._cache.values())

        try:
            driver = get_driver(framework)
        except ValueError:
            return

        try:
            driver.unload(entry.model)
        except Exception:
            pass  # Best-effort cleanup

        # Drop the last reference *before* asking the framework to free memory;
        # otherwise e.g. torch.cuda.empty_cache() can't release the model's tensors.
        del entry
        gc.collect()

        if not framework_still_used:
            try:
                driver.free_memory()
            except Exception:
                pass

    def unload_all(self) -> None:
        """Unload every cached model (used on shutdown)."""
        for name in self.get_loaded_model_names():
            self.unload_model(name)

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
            # bool is a subclass of int in Python, so True/False must not pass as numbers
            is_bool_as_number = isinstance(value, bool) and expected_type_str in ("integer", "float")
            if expected_types and (is_bool_as_number or not isinstance(value, expected_types)):
                errors.append(
                    f"Field '{field}' expected type '{expected_type_str}', "
                    f"got '{type(value).__name__}'"
                )

        return errors

    # ------------------------------------------------------------------
    # Predict (the main entry point for controllers)
    # ------------------------------------------------------------------

    @staticmethod
    def _log(db: Session, model: MLModel, status_code: int, latency_ms: float) -> None:
        db.add(PredictionLog(
            model_id=model.id,
            model_name=model.name,
            status_code=status_code,
            latency_ms=latency_ms,
        ))
        db.commit()

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
            self._log(db, model, 400, 0)
            raise HTTPException(
                status_code=400,
                detail={"validation_errors": errors},
            )

        # 3. Load model (cache hit or driver.load)
        try:
            loaded_model = self.load_model(model)
        except HTTPException:
            self._log(db, model, 500, 0)
            raise

        # 4. Run inference via driver
        driver = get_driver(model.framework)
        start = time.perf_counter()
        try:
            prediction_result = driver.predict(
                loaded_model, input_data, model.input_schema
            )

            # Convert numpy types to native Python
            if isinstance(prediction_result, np.ndarray):
                prediction_result = prediction_result.tolist()

            latency_ms = round((time.perf_counter() - start) * 1000, 2)

            # 5. Log success
            self._log(db, model, 200, latency_ms)

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
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            self._log(db, model, 500, latency_ms)
            raise HTTPException(
                status_code=500,
                detail=f"Prediction failed: {str(e)}",
            )


# Singleton instance — import this in routers/services
model_manager = ModelManager()
