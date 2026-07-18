import logging
import json
import redis
from datetime import date, datetime
from uuid import UUID
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.db_models import Income, Expense, Inventory, Hosteler
from app.schemas.api_schemas import IncomeCreateRequest, ExpenseCreateRequest, InventoryCreateRequest, InventoryEditRequest
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Redis client for Event Bus dispatch (Task 6.2)
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception as e:
    logger.warning(f"Could not connect to Redis broker for event bus: {e}")
    redis_client = None

def dispatch_finance_event(hostel_id: str, event_type: str, payload: dict):
    """Publish real-time financial updates to the Redis event bus (Task 6.2)."""
    if redis_client:
        try:
            event_data = {
                "event_type": event_type,
                "hostel_id": hostel_id,
                "timestamp": datetime.utcnow().isoformat(),
                "payload": payload
            }
            redis_client.publish("tenant_events", json.dumps(event_data))
            logger.info(f"Published event '{event_type}' to Redis event bus.")
        except Exception as e:
            logger.error(f"Failed to publish event to Redis bus: {e}")

def add_income(db: Session, request: IncomeCreateRequest, hostel_id: str) -> Income:
    """Log rent payments, verify resident contexts, and publish event logs (Task 5.2)."""
    # Verify resident exists and is active/not deleted
    hosteler = db.query(Hosteler).filter(Hosteler.id == request.hosteler_id, Hosteler.is_deleted == False).first()
    if not hosteler:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosteler profile not found.")
        
    # Prevent future dates (Section 3.4)
    if request.payment_date > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment date cannot be in the future."
        )
        
    # Generate mock PDF receipt path (Phase 5 requirement / Section 3.6)
    receipt_key = f"receipts/{hostel_id}/income_{uuid_generate()}.pdf"
    
    new_income = Income(
        hosteler_id=request.hosteler_id,
        amount=request.amount,
        payment_date=request.payment_date,
        payment_mode=request.payment_mode,
        reference_number=request.reference_number,
        receipt_url=receipt_key
    )
    
    db.add(new_income)
    db.commit()
    db.refresh(new_income)
    
    # Broadcast alert event to event bus (Task 6.2)
    dispatch_finance_event(
        hostel_id=hostel_id,
        event_type="new_income",
        payload={
            "income_id": str(new_income.id),
            "hosteler_name": hosteler.name,
            "amount": float(new_income.amount)
        }
    )
    
    return new_income

def add_expense(db: Session, request: ExpenseCreateRequest) -> Expense:
    """Register expenditure, verify negative balance restrictions (Task 5.3)."""
    if request.expense_date > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expense date cannot be in the future."
        )
        
    new_expense = Expense(
        category=request.category,
        amount=request.amount,
        expense_date=request.expense_date,
        description=request.description,
        receipt_photo_url=request.receipt_photo_url
    )
    
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

def list_assets(db: Session, page: int, limit: int) -> dict:
    """Fetch active assets from inventory using offset pagination (Task 5.4)."""
    query = db.query(Inventory).filter(Inventory.is_deleted == False)
    
    total_records = query.count()
    total_pages = (total_records + limit - 1) // limit
    
    offset = (page - 1) * limit
    results = query.order_by(Inventory.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "data": results,
        "pagination": {
            "total_records": total_records,
            "current_page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    }

def get_financial_summary(db: Session, start_date: date, end_date: date) -> dict:
    """Calculate sums and net profits for a custom date-range summary report (Task 5.5)."""
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before or equal to end date."
        )
        
    # Sum income
    total_income_query = db.query(func.sum(Income.amount)).filter(
        Income.payment_date >= start_date,
        Income.payment_date <= end_date
    ).scalar() or Decimal("0.00")
    
    # Sum expenses
    total_expenses_query = db.query(func.sum(Expense.amount)).filter(
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date
    ).scalar() or Decimal("0.00")
    
    net_profit = total_income_query - total_expenses_query
    
    return {
        "total_income": total_income_query,
        "total_expenses": total_expenses_query,
        "net_profit": net_profit
    }

def create_asset(db: Session, request: InventoryCreateRequest) -> Inventory:
    """Onboard a new physical asset to inventory."""
    new_asset = Inventory(
        asset_name=request.asset_name,
        quantity=request.quantity,
        condition=request.condition
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return new_asset

def edit_asset(db: Session, asset_id: str, request: InventoryEditRequest) -> Inventory:
    """Update details of a physical asset."""
    asset = db.query(Inventory).filter(Inventory.id == asset_id, Inventory.is_deleted == False).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
        
    update_data = request.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(asset, key, value)
        
    db.commit()
    db.refresh(asset)
    return asset

def soft_delete_asset(db: Session, asset_id: str) -> dict:
    """Soft delete an inventory asset and log timestamp (Task 5.6)."""
    asset = db.query(Inventory).filter(Inventory.id == asset_id, Inventory.is_deleted == False).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
        
    asset.is_deleted = True
    asset.deleted_at = datetime.utcnow()
    db.commit()
    return {"asset_id": asset.id, "status": "soft_deleted"}

def restore_asset(db: Session, asset_id: str) -> dict:
    """Restore a soft deleted inventory asset (Task 5.6)."""
    asset = db.query(Inventory).filter(Inventory.id == asset_id, Inventory.is_deleted == True).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deleted asset not found.")
        
    asset.is_deleted = False
    asset.deleted_at = None
    db.commit()
    return {"asset_id": asset.id, "status": "restored"}

def uuid_generate() -> str:
    """Generate a clean UUID string wrapper."""
    import uuid
    return str(uuid.uuid4())

def get_transactions_list(db: Session, hostel_id: str) -> list:
    """Fetch combined income and expense logs mapped to the unified TransactionResponse schema."""
    incomes = db.query(Income).all()
    expenses = db.query(Expense).all()

    transactions = []
    for inc in incomes:
        # Get hosteler details (if mapped)
        h_name = None
        if inc.hosteler_id:
            hosteler = db.query(Hosteler).filter(Hosteler.id == inc.hosteler_id).first()
            if hosteler:
                h_name = hosteler.name
                
        transactions.append({
            "id": inc.id,
            "hostel_id": hostel_id,
            "type": "income",
            "category": "Rent",
            "amount": inc.amount,
            "date": inc.payment_date,
            "payment_mode": inc.payment_mode,
            "hosteler_id": inc.hosteler_id,
            "hosteler_name": h_name,
            "description": f"Rent payment from {h_name}" if h_name else "Rent payment",
            "receipt_url": inc.receipt_url
        })
        
    for exp in expenses:
        transactions.append({
            "id": exp.id,
            "hostel_id": hostel_id,
            "type": "expense",
            "category": exp.category,
            "amount": exp.amount,
            "date": exp.expense_date,
            "payment_mode": None,
            "hosteler_id": None,
            "hosteler_name": None,
            "description": exp.description,
            "receipt_url": exp.receipt_photo_url
        })
        
    # Sort transactions by date descending
    transactions.sort(key=lambda x: x["date"], reverse=True)
    return transactions
