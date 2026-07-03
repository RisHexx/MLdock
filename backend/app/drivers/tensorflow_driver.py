"""TensorFlow / Keras driver — loads .h5/.keras models and runs model.predict()."""

from typing import Any

from app.drivers.base import BaseDriver


class TensorFlowDriver(BaseDriver):
    """Driver for TensorFlow/Keras models saved as .h5 or .keras files."""

    def load(self, metadata: dict) -> Any:
        """Load a Keras model from disk."""
        import tensorflow as tf

        return tf.keras.models.load_model(metadata["model_path"])

    def predict(self, model: Any, inputs: dict, input_schema: dict) -> Any:
        """Convert inputs to a numpy array and call model.predict()."""
        import numpy as np

        features = [inputs[field] for field in input_schema]
        input_array = np.array([features], dtype=np.float32)
        output = model.predict(input_array, verbose=0)

        if hasattr(output, "tolist"):
            return output.tolist()
        return output

    def unload(self, model: Any) -> None:
        """Clear the Keras session and delete the model."""
        import tensorflow as tf

        del model
        tf.keras.backend.clear_session()

    def validate_model_file(self, file_path: str) -> None:
        """Verify the file can be loaded by tf.keras."""
        import tensorflow as tf

        loaded = tf.keras.models.load_model(file_path)
        del loaded
        tf.keras.backend.clear_session()

    def supported_extensions(self) -> list[str]:
        return [".h5", ".keras"]
