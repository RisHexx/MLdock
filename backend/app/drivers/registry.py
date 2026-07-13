#This file stores a mapping between framework names and driver instances. Other parts of the application (like ModelManager) use this file whenever they need a driver.


#__future__ lets you use newer Python features even if you're running an older version.
from __future__ import annotations
# annotations postpones evaluating type hints.
#Python stores the annotation as a string internally and evaluates it only when needed.

from typing import TYPE_CHECKING

#import happens only during type checking in code editor not while running.
#we cant norammly import becuse it may cause circular import issue
if TYPE_CHECKING:
    from app.drivers.base import BaseDriver


_registry: dict[str, "BaseDriver"] = {} #initailly the dictionary is empty.
#Keys are strings.
#Values are BaseDriver objects.


def register_driver(framework: str, driver: "BaseDriver") -> None:
    """Register a driver instance for a framework name.

    Args:
        framework: Lowercase framework identifier (e.g. 'sklearn', 'pytorch').
        driver: An instance of a BaseDriver subclass.
    """
    _registry[framework] = driver



#Resolve the driver for the given framework.
def get_driver(framework: str) -> "BaseDriver":
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
