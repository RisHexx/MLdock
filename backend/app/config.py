#you can use python-dotenv directly. But config.py gives you validation, type conversion, defaults, and one centralized place to access configuration.

import os
import secrets
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
#just like baseclass in pydantic
#BaseSettings, Instead of validating API data, it validates values from .env
#SettingsConfigDict -> From Where to load environment variables

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    DATABASE_URL: str = "postgresql://mldock:mldock_secret@localhost:5432/mldock"

    # JWT
    # Leave empty to auto-generate a random key that is persisted in STORAGE_PATH/.secret_key
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Storage
    STORAGE_PATH: str = "storage"
    MAX_MODEL_SIZE_MB: int = 200
    # Max models kept in memory at once; least recently used is unloaded first. 0 = unlimited
    MAX_LOADED_MODELS: int = 10

    # App
    APP_NAME: str = "MlDock"
    APP_VERSION: str = "1.0.0"


def _resolve_secret_key(s: Settings) -> str:
    """Use SECRET_KEY from env if set; otherwise load/create a persistent random key.

    Never fall back to a hardcoded key: anyone who knows it could forge JWTs.
    """
    if s.SECRET_KEY.strip():
        return s.SECRET_KEY
    key_file = Path(s.STORAGE_PATH) / ".secret_key"
    if key_file.exists():
        key = key_file.read_text(encoding="utf-8").strip()
        if key:
            return key
    os.makedirs(s.STORAGE_PATH, exist_ok=True)
    key = secrets.token_urlsafe(64)
    key_file.write_text(key, encoding="utf-8")
    try:
        os.chmod(key_file, 0o600)
    except OSError:
        pass
    return key


settings = Settings()
settings.SECRET_KEY = _resolve_secret_key(settings)
