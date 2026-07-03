"""PyTorch driver — loads .pt/.pth models and runs inference with torch.no_grad()."""

from typing import Any

from app.drivers.base import BaseDriver


class PyTorchDriver(BaseDriver):
    """Driver for PyTorch models saved with torch.save()."""

    def load(self, metadata: dict) -> Any:
        """Load a PyTorch model, set to eval mode."""
        import torch

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = torch.load(
            metadata["model_path"],
            map_location=device,
            weights_only=False,
        )
        if hasattr(model, "eval"):
            model.eval()
        return model

    def predict(self, model: Any, inputs: dict, input_schema: dict) -> Any:
        """Convert inputs to a tensor and run inference under no_grad."""
        import torch
        import numpy as np

        features = [inputs[field] for field in input_schema]
        tensor = torch.tensor([features], dtype=torch.float32)

        # Move to same device as model if possible
        if hasattr(model, "parameters"):
            try:
                device = next(model.parameters()).device
                tensor = tensor.to(device)
            except StopIteration:
                pass

        with torch.no_grad():
            output = model(tensor)

        # Convert to list
        if isinstance(output, torch.Tensor):
            return output.cpu().numpy().tolist()
        if isinstance(output, np.ndarray):
            return output.tolist()
        return output

    def unload(self, model: Any) -> None:
        """Delete model and free GPU memory if applicable."""
        import torch

        del model
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    def validate_model_file(self, file_path: str) -> None:
        """Verify the file can be loaded by torch.load()."""
        import torch

        loaded = torch.load(
            file_path,
            map_location=torch.device("cpu"),
            weights_only=False,
        )
        del loaded

    def supported_extensions(self) -> list[str]:
        return [".pt", ".pth"]
