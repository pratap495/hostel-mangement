import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Numeric, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base

class Hosteler(Base):
    __tablename__ = "hostelers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    permanent_address = Column(Text, nullable=False)
    emergency_contact_name = Column(String(100), nullable=False)
    emergency_contact_phone = Column(String(20), nullable=False)
    date_of_joining = Column(Date, nullable=False)
    date_of_vacating = Column(Date, nullable=True)
    vacate_reason = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    photo_url = Column(String(512), nullable=True)
    aadhaar_front_url = Column(String(512), nullable=True)
    aadhaar_back_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Room(Base):
    __tablename__ = "rooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_number = Column(String(20), nullable=False, unique=True)
    floor = Column(Integer, nullable=False)
    room_type = Column(String(20), nullable=False) # Enum: single, double, triple, dormitory
    capacity = Column(Integer, nullable=False)
    monthly_rent = Column(Numeric(10, 2), nullable=False)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class RoomAssignment(Base):
    __tablename__ = "room_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hosteler_id = Column(UUID(as_uuid=True), ForeignKey("hostelers.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    bed_number = Column(Integer, nullable=False)
    assigned_date = Column(Date, nullable=False)
    transferred_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class Income(Base):
    __tablename__ = "income"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hosteler_id = Column(UUID(as_uuid=True), ForeignKey("hostelers.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_mode = Column(String(30), nullable=False) # Enum: cash, upi, bank_transfer, card
    reference_number = Column(String(100), nullable=True)
    receipt_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String(50), nullable=False) # Enum: groceries, maintenance, staff_salary, etc.
    amount = Column(Numeric(10, 2), nullable=False)
    expense_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    receipt_photo_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_name = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    condition = Column(String(30), nullable=False) # Enum: good, needs_repair, damaged
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class StaffUser(Base):
    __tablename__ = "staff_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False) # Enum: manager, warden
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class VisitorLog(Base):
    __tablename__ = "visitor_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    purpose = Column(Text, nullable=False)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    check_in = Column(DateTime, server_default=func.now())
    check_out = Column(DateTime, nullable=True)

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    hosteler_id = Column(UUID(as_uuid=True), ForeignKey("hostelers.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(30), default="open") # Enum: open, in_progress, resolved
    created_at = Column(DateTime, server_default=func.now())

class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notification_type = Column(String(50), nullable=False) # Enum: rent_overdue, room_full, headcount
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
