"""Driver registry — maps framework names to BaseDriver instances.

This is the single lookup point used by ModelManager and the upload pipeline
to resolve the correct driver for a given framework string.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.drivers.base import BaseDriver


_registry: dict[str, "BaseDriver"] = {}


def register_driver(framework: str, driver: "BaseDriver") -> None:
    """Register a driver instance for a framework name.

    Args:
        framework: Lowercase framework identifier (e.g. 'sklearn', 'pytorch').
        driver: An instance of a BaseDriver subclass.
    """
    _registry[framework] = driver


def get_driver(framework: str) -> "BaseDriver":
    """Resolve the driver for the given framework.

    Args:
        framework: The framework identifier from model metadata.

    Returns:
        The registered BaseDriver instance.

    Raises:
        ValueError: If no driver is registered for the framework.
    """
    if framework not in _registry:
        available = list(_registry.keys())
        raise ValueError(
            f"No driver registered for framework '{framework}'. "
            f"Available: {available}"
        )
    return _registry[framework]


def registered_frameworks() -> list[str]:
    """Return the list of currently registered framework identifiers."""
    return list(_registry.keys())
