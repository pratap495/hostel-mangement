from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

# --- Income Schemas ---
class IncomeCreateRequest(BaseModel):
    hosteler_id: UUID
    amount: Decimal = Field(..., gt=0.00) # Amount must be positive (Section 3.4)
    payment_date: date
    payment_mode: str = Field(..., pattern="^(cash|upi|bank_transfer|card)$")
    reference_number: Optional[str] = Field(None, max_length=100)

class IncomeResponse(BaseModel):
    id: UUID
    hosteler_id: UUID
    amount: Decimal
    payment_date: date
    payment_mode: str
    reference_number: Optional[str]
    receipt_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Expense Schemas ---
class ExpenseCreateRequest(BaseModel):
    category: str = Field(..., pattern="^(groceries|maintenance|staff_salary|electricity|water|repairs)$")
    amount: Decimal = Field(..., gt=0.00) # Amount must be positive (Section 3.4)
    expense_date: date
    description: Optional[str] = None
    receipt_photo_url: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: UUID
    category: str
    amount: Decimal
    expense_date: date
    description: Optional[str]
    receipt_photo_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Inventory / Asset Schemas ---
class InventoryCreateRequest(BaseModel):
    asset_name: str = Field(..., min_length=1, max_length=100)
    quantity: int = Field(..., ge=0)
    condition: str = Field(..., pattern="^(good|needs_repair|damaged)$")

class InventoryResponse(BaseModel):
    id: UUID
    asset_name: str
    quantity: int
    condition: str
    created_at: datetime

    class Config:
        from_attributes = True

class InventoryEditRequest(BaseModel):
    asset_name: Optional[str] = None
    quantity: Optional[int] = None
    condition: Optional[str] = None

# --- Report Summaries ---
class FinancialSummaryResponse(BaseModel):
    total_income: Decimal
    total_expenses: Decimal
    net_profit: Decimal

# --- Pagination wrappers ---
class PaginationMeta(BaseModel):
    total_records: int
    current_page: int
    limit: int
    total_pages: int

class PaginatedInventoryResponse(BaseModel):
    data: List[InventoryResponse]
    pagination: PaginationMeta
