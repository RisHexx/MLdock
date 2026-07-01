from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    DATABASE_URL: str = "postgresql://mldock:mldock_secret@localhost:5432/mldock"

    # JWT
    SECRET_KEY: str = "mldock-dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Storage
    STORAGE_PATH: str = "storage"
    MAX_MODEL_SIZE_MB: int = 200

    # App
    APP_NAME: str = "MlDock"
    APP_VERSION: str = "1.0.0"


settings = Settings()
