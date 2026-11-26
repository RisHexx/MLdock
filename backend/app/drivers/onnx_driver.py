"""ONNX Runtime driver — loads .onnx models and runs inference via InferenceSession."""

from typing import Any

from app.drivers.base import BaseDriver

# Map ONNX tensor element types to numpy dtypes (models exported from sklearn
# often use float32, but some expect double or int64 — sending the wrong one errors).
_ONNX_DTYPES = {
    "tensor(float)": "float32",
    "tensor(double)": "float64",
    "tensor(int64)": "int64",
    "tensor(int32)": "int32",
    "tensor(bool)": "bool",
}


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

        # ONNX models declare their input names and element types — use the first input
        model_input = model.get_inputs()[0]
        input_name = model_input.name
        input_array = np.array([features], dtype=_ONNX_DTYPES.get(model_input.type, np.float32))
        output = model.run(None, {input_name: input_array})

        # output is a list of arrays, one per model output
        if output and hasattr(output[0], "tolist"):
            return output[0].tolist()
        return output

    def unload(self, model: Any) -> None:
        """Nothing to do — the session is freed once ModelManager drops its reference."""
        return None

    def validate_model_file(self, file_path: str) -> None:
        """Verify the file can be loaded as an ONNX session."""
        import onnxruntime as ort

        session = ort.InferenceSession(file_path)
        del session

    def supported_extensions(self) -> list[str]:
        return [".onnx"]
