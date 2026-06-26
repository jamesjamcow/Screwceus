from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Screwceus API"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    database_url: str = Field(..., alias="DATABASE_URL")
    allowed_origins_raw: str = Field(default="http://localhost:5173", alias="ALLOWED_ORIGINS")
    max_image_upload_bytes: int = Field(default=10 * 1024 * 1024, alias="MAX_IMAGE_UPLOAD_BYTES")
    max_model_upload_bytes: int = Field(default=50 * 1024 * 1024, alias="MAX_MODEL_UPLOAD_BYTES")
    uploadthing_token: str = Field(default="", alias="UPLOADTHING_TOKEN")
    uploadthing_api_url: str = Field(default="https://api.uploadthing.com", alias="UPLOADTHING_API_URL")
    uploadthing_api_version: str = Field(default="7.7.4", alias="UPLOADTHING_API_VERSION")

    clerk_issuer: str = Field(..., alias="CLERK_ISSUER")
    clerk_jwks_url: str = Field(..., alias="CLERK_JWKS_URL")
    clerk_audience: str | None = Field(default=None, alias="CLERK_AUDIENCE")
    clerk_secret_key: str = Field(default="", alias="CLERK_SECRET_KEY")
    clerk_api_url: str = Field(default="https://api.clerk.com/v1", alias="CLERK_API_URL")
    clerk_webhook_signing_secret: str = Field(default="", alias="CLERK_WEBHOOK_SIGNING_SECRET")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
