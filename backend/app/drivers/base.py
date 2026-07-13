from abc import ABC, abstractmethod
from typing import Any

# An abstract class is a class that cannot be instantiated directly. Its purpose is to define a common interface and shared behavior for subclasses.

class BaseDriver(ABC):
    """Interface that all framework drivers must implement.

    To add support for a new ML framework:
    1. Create a new driver class inheriting from BaseDriver.
    2. Implement all abstract methods.
    3. Register it in app/drivers/__init__.py.
    """

    @abstractmethod
    def load(self, metadata: dict) -> Any:
        """Load a model from disk given its metadata dict.

        Args:
            metadata: Model metadata containing at minimum 'model_path'
                      and 'framework' keys.

        Returns:
            The loaded model object (framework-specific).

        Raises:
            Exception: If the model file cannot be loaded.
        """
        ...

    @abstractmethod
    def predict(self, model: Any, inputs: dict, input_schema: dict) -> Any:
        """Run inference on a loaded model.

        Args:
            model: The loaded model object returned by load().
            inputs: Dict of input field name -> value.
            input_schema: Dict of field name -> type string, defining
                          the expected order and types of input features.

        Returns:
            Raw prediction result (typically a list or numpy array).
        """
        ...

    @abstractmethod
    def unload(self, model: Any) -> None:
        """Release any resources held by the loaded model.

        For CPU-only frameworks this may be a no-op. For GPU frameworks
        (PyTorch, TensorFlow) this should free GPU memory.

        Args:
            model: The loaded model object to release.
        """
        ...

    #Checks whether a model file is valid before saving or using it.
    @abstractmethod
    def validate_model_file(self, file_path: str) -> None:
        """Quick-check that a model file on disk is loadable.

        Called during the upload pipeline before the model is persisted.

        Args:
            file_path: Absolute path to the model file on disk.

        Raises:
            Exception: If the file is not a valid model for this framework.
        """
        ...

    @abstractmethod
    def supported_extensions(self) -> list[str]:
        """Return the file extensions this driver can handle.

        Returns:
            List of lowercase extensions including the dot,
            e.g. ['.pkl', '.joblib'].
        """
        ...
