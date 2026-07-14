from pydantic import BaseModel, Field
from typing import List
from uuid import UUID
from datetime import datetime

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
                "detail": "Validation failed: 'log_id' must be a valid UUID."
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
                "service": "notification_service"
            }
        }
    }

class NotificationLogResponse(BaseModel):
    id: UUID = Field(..., description="Unique notification alert log ID")
    notification_type: str = Field(..., description="Alert category (rent_overdue, room_full, headcount)")
    message: str = Field(..., description="Verbose description of the notification event")
    is_read: bool = Field(..., description="Read/unread status flag")
    created_at: datetime = Field(..., description="Timestamp when the event occurred")

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "e4b21d89-9a7c-47bc-8a21-987d1a293b8e",
                "notification_type": "rent_overdue",
                "message": "Rent payment of INR 6000.00 is overdue for Resident Alex Mercer (Room 202).",
                "is_read": False,
                "created_at": "2026-07-13T21:40:00Z"
            }
        }
    }

class PaginationMeta(BaseModel):
    total_records: int
    current_page: int
    limit: int
    total_pages: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_records": 45,
                "current_page": 1,
                "limit": 10,
                "total_pages": 5
            }
        }
    }

class PaginatedNotificationsResponse(BaseModel):
    data: List[NotificationLogResponse]
    pagination: PaginationMeta

    model_config = {
        "json_schema_extra": {
            "example": {
                "data": [
                    {
                        "id": "e4b21d89-9a7c-47bc-8a21-987d1a293b8e",
                        "notification_type": "rent_overdue",
                        "message": "Rent payment of INR 6000.00 is overdue for Resident Alex Mercer (Room 202).",
                        "is_read": False,
                        "created_at": "2026-07-13T21:40:00Z"
                    }
                ],
                "pagination": {
                    "total_records": 1,
                    "current_page": 1,
                    "limit": 10,
                    "total_pages": 1
                }
            }
        }
    }

class NotificationReadResponse(BaseModel):
    log_id: UUID = Field(..., description="ID of the marked log entry")
    is_read: bool = Field(..., description="Updated read status")

    model_config = {
        "json_schema_extra": {
            "example": {
                "log_id": "e4b21d89-9a7c-47bc-8a21-987d1a293b8e",
                "is_read": True
            }
        }
    }
