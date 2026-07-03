"""ONNX Runtime driver — loads .onnx models and runs inference via InferenceSession."""

from typing import Any

from app.drivers.base import BaseDriver


class OnnxDriver(BaseDriver):
    """Driver for ONNX models using onnxruntime."""

    def load(self, metadata: dict) -> Any:
        """Create an ONNX InferenceSession from the model file."""
        import onnxruntime as ort

        return ort.InferenceSession(metadata["model_path"])

    def predict(self, model: Any, inputs: dict, input_schema: dict) -> Any:
        """Build the input feed and run the ONNX session."""
        import numpy as np

        features = [inputs[field] for field in input_schema]
        input_array = np.array([features], dtype=np.float32)

        # ONNX models declare their input names — use the first one
        input_name = model.get_inputs()[0].name
        output = model.run(None, {input_name: input_array})

        # output is a list of arrays, one per model output
        if output and hasattr(output[0], "tolist"):
            return output[0].tolist()
        return output

    def unload(self, model: Any) -> None:
        """Release the inference session."""
        del model

    def validate_model_file(self, file_path: str) -> None:
        """Verify the file can be loaded as an ONNX session."""
        import onnxruntime as ort

        session = ort.InferenceSession(file_path)
        del session

    def supported_extensions(self) -> list[str]:
        return [".onnx"]
