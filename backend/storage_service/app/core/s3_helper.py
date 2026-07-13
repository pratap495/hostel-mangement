import boto3
import logging
from botocore.config import Config
from .config import settings

logger = logging.getLogger(__name__)

# Initialize boto3 S3 client connection (Task 7.3)
try:
    s3_client = boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        region_name=settings.S3_REGION_NAME,
        config=Config(signature_version="s3v4")
    )
except Exception as e:
    logger.error(f"Failed to connect to MinIO/S3 object storage: {e}")
    s3_client = None

def ensure_bucket_exists():
    """Verify that the secure file vault bucket exists on object storage. Creates it if missing."""
    if not s3_client:
        return
    try:
        s3_client.head_bucket(Bucket=settings.S3_BUCKET_NAME)
    except s3_client.exceptions.ClientError:
        try:
            s3_client.create_bucket(
                Bucket=settings.S3_BUCKET_NAME,
                CreateBucketConfiguration={"LocationConstraint": settings.S3_REGION_NAME} if settings.S3_REGION_NAME != "us-east-1" else {}
            )
            logger.info(f"Secure bucket '{settings.S3_BUCKET_NAME}' created successfully.")
        except Exception as e:
            logger.error(f"Could not create storage bucket: {e}")

def get_presigned_download_url(file_key: str, expires_in: int = 120) -> str:
    """Generate a secure, short-lived presigned GET URL (120-second validity constraint) (Task 7.2)."""
    if not s3_client or not file_key:
        return ""
    try:
        url = s3_client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": settings.S3_BUCKET_NAME, "Key": file_key},
            ExpiresIn=expires_in
        )
        return url
    except Exception as e:
        logger.error(f"Error generating presigned download URL for {file_key}: {e}")
        return ""

def get_presigned_upload_url(file_name: str, mime_type: str, expires_in: int = 300) -> dict:
    """Generate a presigned POST upload policy for client-side uploads (Task 7.1)."""
    if not s3_client:
        return {}
    try:
        # Generate unique key in S3
        file_key = f"uploads/{file_name}"
        post_policy = s3_client.generate_presigned_post(
            Bucket=settings.S3_BUCKET_NAME,
            Key=file_key,
            Fields={"Content-Type": mime_type},
            Conditions=[{"Content-Type": mime_type}],
            ExpiresIn=expires_in
        )
        return {
            "upload_url": post_policy["url"],
            "fields": post_policy["fields"],
            "file_key": file_key
        }
    except Exception as e:
        logger.error(f"Error generating presigned POST upload URL: {e}")
        return {}
