from pydantic import BaseModel, Field
from typing import Dict
from uuid import UUID

class SuccessResponse(BaseModel):
    message: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "Operation completed successfully."
            }
        }
    }

class ErrorResponse(BaseModel):
    detail: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "detail": "Validation failed: 'file_name' is required."
            }
        }
    }

class HealthResponse(BaseModel):
    status: str
    service: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "healthy",
                "service": "storage_service"
            }
        }
    }

class PresignedUploadResponse(BaseModel):
    upload_url: str = Field(..., description="S3/MinIO bucket entrypoint URL")
    fields: Dict[str, str] = Field(..., description="Multipart upload policy headers and credentials")
    file_key: str = Field(..., description="Unique secure vault reference key for the file")

    model_config = {
        "json_schema_extra": {
            "example": {
                "upload_url": "http://localhost/hostelmint-secure-vault",
                "fields": {
                    "key": "uploads/profile.jpg",
                    "Content-Type": "image/jpeg",
                    "policy": "eyJleHBpcmF0aW9uIjogIjIwMjYtMDctMTNUMjI6MDQ6NDZaIiwgImNvbmRpdGlvbnMiOiBbWyJlcSIsICIkYnVja2V0IiwgImhvc3RlbG1pbnQtc2VjdXJlLXZhdWx0Il0sIFsiZXEiLCAiJGtleSIsICJ1cGxvYWRzL3Byb2ZpbGUuanBnIl1dfQ==",
                    "x-amz-signature": "d9868ba89f2a93b8e...",
                    "x-amz-credential": "minioadmin/20260713/us-east-1/s3/aws4_request"
                },
                "file_key": "uploads/profile.jpg"
            }
        }
    }

class PresignedDownloadResponse(BaseModel):
    download_url: str = Field(..., description="Short-lived secure download token URL (expires in 120 seconds)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "download_url": "http://localhost/hostelmint-secure-vault/uploads/profile.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20260713%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260713T214000Z&X-Amz-Expires=120&X-Amz-SignedHeaders=host&X-Amz-Signature=d8721c89f..."
            }
        }
    }
