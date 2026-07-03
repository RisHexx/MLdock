"""Driver package — auto-registers all available framework drivers.

Sklearn is always registered. PyTorch, TensorFlow, and ONNX are registered
only if their runtime dependencies are installed.
"""

import logging

from app.drivers.registry import register_driver, get_driver, registered_frameworks  # noqa: F401

logger = logging.getLogger(__name__)

# --- Always available ---
from app.drivers.sklearn_driver import SklearnDriver  # noqa: E402

register_driver("sklearn", SklearnDriver())

# --- Optional frameworks (safe imports) ---
try:
    from app.drivers.pytorch_driver import PyTorchDriver  # noqa: E402

    register_driver("pytorch", PyTorchDriver())
    logger.info("PyTorch driver registered")
except ImportError:
    logger.debug("PyTorch not installed — pytorch driver not available")

try:
    from app.drivers.tensorflow_driver import TensorFlowDriver  # noqa: E402

    register_driver("tensorflow", TensorFlowDriver())
    logger.info("TensorFlow driver registered")
except ImportError:
    logger.debug("TensorFlow not installed — tensorflow driver not available")

try:
    from app.drivers.onnx_driver import OnnxDriver  # noqa: E402

    register_driver("onnx", OnnxDriver())
    logger.info("ONNX Runtime driver registered")
except ImportError:
    logger.debug("ONNX Runtime not installed — onnx driver not available")
