from fastapi import APIRouter, Depends, Query, status
from app.core.security import require_owner_or_admin
from app.core.s3_helper import get_presigned_upload_url, get_presigned_download_url
from app.schemas.api_schemas import (
    PresignedUploadResponse, PresignedDownloadResponse,
    SuccessResponse, ErrorResponse, HealthResponse
)

router = APIRouter(prefix="/storage", tags=["Secure Object Storage"])

@router.get(
    "/health", 
    include_in_schema=False
)
def health():
    """System health check."""
    return {"status": "healthy", "service": "storage_service"}

@router.post(
    "/presigned-upload", 
    response_model=PresignedUploadResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {
            "description": "Unauthorized - Missing or invalid access token",
            "content": {"application/json": {"example": {"detail": "Could not validate credentials"}}}
        },
        403: {
            "description": "Forbidden - First-time password change required",
            "content": {"application/json": {"example": {"detail": "FORCE_PASSWORD_RESET_REQUIRED: Please set your new password before accessing system resources."}}}
        },
        422: {
            "model": ErrorResponse,
            "description": "Validation Error",
            "content": {"application/json": {"example": {"detail": "Validation failed: 'file_name' is required; 'mime_type' is required."}}}
        }
    }
)
def request_presigned_upload(
    file_name: str = Query(..., description="Target file name"),
    mime_type: str = Query(..., description="File MIME content type"),
    user: dict = Depends(require_owner_or_admin)
):
    """Request a secure S3 presigned POST upload policy for client-side uploads (Task 7.1)."""
    return get_presigned_upload_url(file_name, mime_type)

@router.get(
    "/presigned-download", 
    response_model=PresignedDownloadResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {
            "description": "Unauthorized - Missing or invalid access token",
            "content": {"application/json": {"example": {"detail": "Could not validate credentials"}}}
        },
        403: {
            "description": "Forbidden - First-time password change required",
            "content": {"application/json": {"example": {"detail": "FORCE_PASSWORD_RESET_REQUIRED: Please set your new password before accessing system resources."}}}
        },
        422: {
            "model": ErrorResponse,
            "description": "Validation Error",
            "content": {"application/json": {"example": {"detail": "Validation failed: 'file_key' is required."}}}
        }
    }
)
def request_presigned_download(
    file_key: str = Query(..., description="Raw object storage file key"),
    user: dict = Depends(require_owner_or_admin)
):
    """Generate a secure, short-lived presigned GET URL (120-second validity constraint) (Task 7.2)."""
    download_url = get_presigned_download_url(file_key, expires_in=120)
    return {"download_url": download_url}
