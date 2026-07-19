import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base

class SuperAdmin(Base):
    __tablename__ = "super_admins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    force_password_reset = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class Owner(Base):
    __tablename__ = "owners"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    force_password_reset = Column(Boolean, default=True)
    photo_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class Hostel(Base):
    __tablename__ = "hostels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    address = Column(Text, nullable=False)
    contact_number = Column(String(20), nullable=False)
    floors_count = Column(Integer, nullable=False)
    rooms_count = Column(Integer, nullable=False)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

class OwnerHostel(Base):
    __tablename__ = "owner_hostels"

    owner_id = Column(UUID(as_uuid=True), ForeignKey("owners.id", ondelete="CASCADE"), primary_key=True)
    hostel_id = Column(UUID(as_uuid=True), ForeignKey("hostels.id", ondelete="CASCADE"), primary_key=True)

class TenantDatabase(Base):
    __tablename__ = "tenant_databases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hostel_id = Column(UUID(as_uuid=True), ForeignKey("hostels.id", ondelete="CASCADE"), unique=True, nullable=False)
    db_name = Column(String(100), nullable=False)
    db_host = Column(String(150), nullable=False)
    db_port = Column(Integer, nullable=False, default=5432)
    db_username = Column(String(100), nullable=False)
    db_password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class OwnerActivityLog(Base):
    __tablename__ = "owner_activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("owners.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(100), nullable=False)
    hostel_id = Column(UUID(as_uuid=True), ForeignKey("hostels.id", ondelete="SET NULL"), nullable=True)
    ip_address = Column(String(45), nullable=False)
    user_agent = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
