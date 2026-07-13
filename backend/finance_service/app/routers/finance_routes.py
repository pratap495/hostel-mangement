from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from typing import Optional
from app.core.tenant_middleware import get_tenant_db
from app.core.security import require_owner_or_admin
from app.schemas.api_schemas import (
    IncomeCreateRequest, IncomeResponse, ExpenseCreateRequest, ExpenseResponse,
    InventoryCreateRequest, InventoryResponse, InventoryEditRequest,
    FinancialSummaryResponse, PaginatedInventoryResponse
)
from app.controllers.finance_controller import (
    add_income, add_expense, list_assets, create_asset, edit_asset,
    soft_delete_asset, restore_asset, get_financial_summary
)

router = APIRouter(prefix="/finance", tags=["Finance Ledger"])

@router.post("/income", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def log_new_income(
    request: IncomeCreateRequest,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Log a new payment receipt with validation and trigger event broadcast (Task 5.2)."""
    hostel_id = user["hostel_id"] if "hostel_id" in user else "dummy_hostel"
    return add_income(db, request, hostel_id)

@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def log_new_expense(
    request: ExpenseCreateRequest,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Log an operational expense under category validations (Task 5.3)."""
    return add_expense(db, request)

@router.get("/inventory", response_model=PaginatedInventoryResponse)
def get_inventory_items(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Fetch paginated listings of registered hostel assets (Task 5.4)."""
    return list_assets(db, page, limit)

@router.post("/inventory", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def add_inventory_item(
    request: InventoryCreateRequest,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Onboard a new physical asset item into the inventory register."""
    return create_asset(db, request)

@router.put("/inventory/{asset_id}", response_model=InventoryResponse)
def update_inventory_item(
    asset_id: UUID,
    request: InventoryEditRequest,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Update quantities or conditions of registered assets."""
    return edit_asset(db, str(asset_id), request)

@router.delete("/inventory/{asset_id}")
def delete_inventory_item(
    asset_id: UUID,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Soft delete an inventory asset and save deletion timestamps (Task 5.6)."""
    return soft_delete_asset(db, str(asset_id))

@router.post("/inventory/{asset_id}/restore")
def restore_inventory_item(
    asset_id: UUID,
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Restore a previously soft deleted inventory asset (Task 5.6)."""
    return restore_asset(db, str(asset_id))

@router.get("/summary", response_model=FinancialSummaryResponse)
def get_ledger_summary(
    start_date: date = Query(..., description="Query range start date"),
    end_date: date = Query(..., description="Query range end date"),
    db: Session = Depends(get_tenant_db),
    user: dict = Depends(require_owner_or_admin)
):
    """Get calculated sum of income, expenses, and net profit report metrics (Task 5.5)."""
    return get_financial_summary(db, start_date, end_date)
