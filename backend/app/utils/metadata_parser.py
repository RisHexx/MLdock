import json
import re

from app.drivers.registry import registered_frameworks

SUPPORTED_TYPES = ["integer", "float", "string", "boolean"]


def parse_and_validate_metadata(content: str) -> dict:
    """Parse and validate metadata.json content. Raises ValueError on invalid input."""

    try:
        metadata = json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON: {str(e)}")

    # Required fields
    required_fields = ["name", "display_name", "framework", "input_schema", "output_schema"]
    for field in required_fields:
        if field not in metadata:
            raise ValueError(f"Missing required field: '{field}'")

    # Validate name format (lowercase alphanumeric + hyphens)
    name = metadata["name"]
    if len(name) < 2 or len(name) > 100:
        raise ValueError("Model name must be between 2 and 100 characters")
    if not re.match(r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$", name):
        raise ValueError(
            f"Invalid model name: '{name}'. Must be lowercase alphanumeric with hyphens only, "
            "starting and ending with a letter or digit."
        )

    # Validate framework against registered drivers
    framework = metadata["framework"]
    supported = registered_frameworks()
    if framework not in supported:
        raise ValueError(
            f"Unsupported framework: '{framework}'. Supported: {supported}"
        )

    # Validate input_schema
    input_schema = metadata["input_schema"]
    if not isinstance(input_schema, dict) or len(input_schema) == 0:
        raise ValueError("input_schema must be a non-empty object")

    for field_name, field_type in input_schema.items():
        if field_type not in SUPPORTED_TYPES:
            raise ValueError(
                f"Unsupported type '{field_type}' for field '{field_name}'. "
                f"Supported: {SUPPORTED_TYPES}"
            )

    # Validate output_schema
    output_schema = metadata["output_schema"]
    if not isinstance(output_schema, dict) or len(output_schema) == 0:
        raise ValueError("output_schema must be a non-empty object")

    for field_name, field_type in output_schema.items():
        if field_type not in SUPPORTED_TYPES:
            raise ValueError(
                f"Unsupported type '{field_type}' for output field '{field_name}'. "
                f"Supported: {SUPPORTED_TYPES}"
            )

    return metadata
