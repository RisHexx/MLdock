"""Prediction service — backward-compatibility shim.

All model lifecycle and inference logic has been migrated to
app.services.model_manager.ModelManager and the driver layer.
This module re-exports key symbols so existing imports don't break.
"""

from app.services.model_manager import model_manager


def get_loaded_model_count() -> int:
    """Delegate to ModelManager."""
    return model_manager.get_loaded_model_count()


def get_memory_usage_mb() -> float:
    """Delegate to ModelManager."""
    return model_manager.get_memory_usage_mb()


def unload_model(model_name: str) -> None:
    """Delegate to ModelManager."""
    model_manager.unload_model(model_name)

