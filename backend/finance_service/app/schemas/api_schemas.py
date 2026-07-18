from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

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
                "detail": "Validation failed: 'amount' must be positive."
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
                "service": "finance_service"
            }
        }
    }

class AssetActionResponse(BaseModel):
    asset_id: UUID
    status: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "asset_id": "e4b21d89-9a7c-47bc-8a21-987d1a293b8e",
                "status": "soft_deleted"
            }
        }
    }

# --- Income Schemas ---
class IncomeCreateRequest(BaseModel):
    hosteler_id: UUID
    amount: Decimal = Field(..., gt=0.00) # Amount must be positive (Section 3.4)
    payment_date: date
    payment_mode: str = Field(..., pattern="^(cash|upi|bank_transfer|card)$")
    reference_number: Optional[str] = Field(None, max_length=100)

    model_config = {
        "json_schema_extra": {
            "example": {
                "hosteler_id": "a2e7f496-7f3c-493c-82ab-5de9d5770ac1",
                "amount": 6000.00,
                "payment_date": "2026-07-13",
                "payment_mode": "upi",
                "reference_number": "TXN998877"
            }
        }
    }

class IncomeResponse(BaseModel):
    id: UUID
    hosteler_id: UUID
    amount: Decimal
    payment_date: date
    payment_mode: str
    reference_number: Optional[str]
    receipt_url: Optional[str]
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "e4b21d89-9a7c-47bc-8a21-987d1a293b8e",
                "hosteler_id": "a2e7f496-7f3c-493c-82ab-5de9d5770ac1",
                "amount": 6000.00,
                "payment_date": "2026-07-13",
                "payment_mode": "upi",
                "reference_number": "TXN998877",
                "receipt_url": "http://localhost/api/v1/storage/download/receipt.jpg",
                "created_at": "2026-07-13T21:40:00Z"
            }
        }
    }

# --- Expense Schemas ---
class ExpenseCreateRequest(BaseModel):
    category: str = Field(..., pattern="^(groceries|maintenance|staff_salary|electricity|water|repairs)$")
    amount: Decimal = Field(..., gt=0.00) # Amount must be positive (Section 3.4)
    expense_date: date
    description: Optional[str] = None
    receipt_photo_url: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "category": "maintenance",
                "amount": 1500.00,
                "expense_date": "2026-07-13",
                "description": "Plumbing repairs for Room 202",
                "receipt_photo_url": "uploads/expense_receipt.jpg"
            }
        }
    }

class ExpenseResponse(BaseModel):
    id: UUID
    category: str
    amount: Decimal
    expense_date: date
    description: Optional[str]
    receipt_photo_url: Optional[str]
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "e4b21d89-9a7c-47bc-8a21-987d1a293b8e",
                "category": "maintenance",
                "amount": 1500.00,
                "expense_date": "2026-07-13",
                "description": "Plumbing repairs for Room 202",
                "receipt_photo_url": "http://localhost/api/v1/storage/download/receipt.jpg",
                "created_at": "2026-07-13T21:40:00Z"
            }
        }
    }

# --- Inventory / Asset Schemas ---
class InventoryCreateRequest(BaseModel):
    asset_name: str = Field(..., min_length=1, max_length=100)
    quantity: int = Field(..., ge=0)
    condition: str = Field(..., pattern="^(good|needs_repair|damaged)$")

    model_config = {
        "json_schema_extra": {
            "example": {
                "asset_name": "Steel Cot Bed",
                "quantity": 10,
                "condition": "good"
            }
        }
    }

class InventoryResponse(BaseModel):
    id: UUID
    asset_name: str
    quantity: int
    condition: str
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "c3438ddb-730c-4395-ba60-5a8222390386",
                "asset_name": "Steel Cot Bed",
                "quantity": 10,
                "condition": "good",
                "created_at": "2026-07-13T21:40:00Z"
            }
        }
    }

class InventoryEditRequest(BaseModel):
    asset_name: Optional[str] = None
    quantity: Optional[int] = None
    condition: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "asset_name": "Steel Cot Bed Updated",
                "quantity": 12,
                "condition": "needs_repair"
            }
        }
    }

# --- Report Summaries ---
class FinancialSummaryResponse(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    net_profit: Decimal

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_income": 6000.00,
                "total_expenses": 1500.00,
                "net_profit": 4500.00
            }
        }
    }

# --- Pagination wrappers ---
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

class PaginatedInventoryResponse(BaseModel):
    data: List[InventoryResponse]
    pagination: PaginationMeta

    model_config = {
        "json_schema_extra": {
            "example": {
                "data": [
                    {
                        "id": "c3438ddb-730c-4395-ba60-5a8222390386",
                        "asset_name": "Steel Cot Bed",
                        "quantity": 10,
                        "condition": "good",
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

class TransactionResponse(BaseModel):
    id: UUID
    hostel_id: str
    type: str # 'income' or 'expense'
    category: str
    amount: Decimal
    date: date
    payment_mode: Optional[str] = None
    hosteler_id: Optional[UUID] = None
    hosteler_name: Optional[str] = None
    description: Optional[str] = None
    receipt_url: Optional[str] = None

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "e4b21d89-9a7c-47bc-8a21-987d1a293b8e",
                "hostel_id": "a9018c64-41c3-e83c-ab0b-47e289bf4055",
                "type": "income",
                "category": "Rent",
                "amount": 6000.00,
                "date": "2026-07-13",
                "payment_mode": "upi",
                "hosteler_id": "a2e7f496-7f3c-493c-82ab-5de9d5770ac1",
                "hosteler_name": "Resident A",
                "description": "Rent payment from Resident A",
                "receipt_url": "receipts/a9018c64-41c3-e83c-ab0b-47e289bf4055/income_e4b21d89.pdf"
            }
        }
    }
