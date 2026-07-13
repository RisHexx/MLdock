import joblib
from typing import Any

from app.drivers.base import BaseDriver


class SklearnDriver(BaseDriver):
    """Driver for scikit-learn models serialized with joblib/pickle."""

    def load(self, metadata: dict) -> Any:
        """Load a sklearn model from its file path."""
        return joblib.load(metadata["model_path"])

    def predict(self, model: Any, inputs: dict, input_schema: dict) -> Any:
        """Build a feature array in schema order and call model.predict()."""
        features = [inputs[field] for field in input_schema]
        return model.predict([features])

    def unload(self, model: Any) -> None:
        """No-op for sklearn — garbage collection handles cleanup."""
        del model

    def validate_model_file(self, file_path: str) -> None:
        """Verify the file can be loaded by joblib."""
        loaded = joblib.load(file_path)
        del loaded

    def supported_extensions(self) -> list[str]:
        return [".pkl", ".joblib"]
