import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_ENV: str = os.getenv("APP_ENV", "production")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"

    # Database
    CENTRAL_DATABASE_URL: str = os.getenv(
        "CENTRAL_DATABASE_URL",
        "postgresql://central_admin:password123@postgres-db:5432/hostelmint_admin_db"
    )

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis-broker:6379/0")

    # Secure S3 Storage
    S3_ENDPOINT_URL: str = os.getenv("S3_ENDPOINT_URL", "http://minio-storage:9000")
    S3_ACCESS_KEY_ID: str = os.getenv("S3_ACCESS_KEY_ID", "minioadmin")
    S3_SECRET_ACCESS_KEY: str = os.getenv("S3_SECRET_ACCESS_KEY", "minioadminpassword")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "hostelmint-secure-vault")
    S3_REGION_NAME: str = os.getenv("S3_REGION_NAME", "ap-south-1")

    class Config:
        env_file = ".env"

settings = Settings()

# Validate that secret key is set in production
if settings.APP_ENV == "production" and not settings.SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required in production environment.")
