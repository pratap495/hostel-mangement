import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_ENV: str = os.getenv("APP_ENV", "production")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 Hours

    # Database
    CENTRAL_DATABASE_URL: str = os.getenv(
        "CENTRAL_DATABASE_URL",
        "postgresql://central_admin:password123@postgres-db:5432/hostelmint_admin_db"
    )

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis-broker:6379/0")

    # Rate Limiting
    MAX_FAILED_ATTEMPTS: int = 5
    LOCKOUT_DURATION_SECONDS: int = 900  # 15 Minutes

    # Transactional SMTP mail relay configs
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.brevo.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "alerts@hostelmint.com")

    class Config:
        env_file = ".env"

settings = Settings()

# Validate that secret key is set in production
if settings.APP_ENV == "production" and not settings.SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required in production environment.")
