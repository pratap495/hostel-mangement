from fastapi import APIRouter, Depends, Query, status
from app.core.security import require_owner_or_admin
from app.core.s3_helper import get_presigned_upload_url, get_presigned_download_url

router = APIRouter(prefix="/storage", tags=["Secure Object Storage"])

@router.post("/presigned-upload", status_code=status.HTTP_200_OK)
def request_presigned_upload(
    file_name: str = Query(..., description="Target file name"),
    mime_type: str = Query(..., description="File MIME content type"),
    user: dict = Depends(require_owner_or_admin)
):
    """Request a secure S3 presigned POST upload policy for client-side uploads (Task 7.1)."""
    return get_presigned_upload_url(file_name, mime_type)

@router.get("/presigned-download", status_code=status.HTTP_200_OK)
def request_presigned_download(
    file_key: str = Query(..., description="Raw object storage file key"),
    user: dict = Depends(require_owner_or_admin)
):
    """Generate a secure, short-lived presigned GET URL (120-second validity constraint) (Task 7.2)."""
    download_url = get_presigned_download_url(file_key, expires_in=120)
    return {"download_url": download_url}
