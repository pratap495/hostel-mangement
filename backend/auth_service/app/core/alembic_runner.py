import logging
from sqlalchemy import create_engine, text

logger = logging.getLogger(__name__)

# Complete dynamic database schema DDL matching Section 1.2 & 1.3 specs
TENANT_SCHEMA_DDL = """
-- 1. Create custom ENUM types if they do not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_type_enum') THEN
        CREATE TYPE room_type_enum AS ENUM ('single', 'double', 'triple', 'dormitory');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_mode_enum') THEN
        CREATE TYPE payment_mode_enum AS ENUM ('cash', 'upi', 'bank_transfer', 'card');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category_enum') THEN
        CREATE TYPE expense_category_enum AS ENUM ('groceries', 'maintenance', 'staff_salary', 'electricity', 'water', 'repairs');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_condition_enum') THEN
        CREATE TYPE asset_condition_enum AS ENUM ('good', 'needs_repair', 'damaged');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role_enum') THEN
        CREATE TYPE staff_role_enum AS ENUM ('manager', 'warden');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaint_status_enum') THEN
        CREATE TYPE complaint_status_enum AS ENUM ('open', 'in_progress', 'resolved');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
        CREATE TYPE notification_type_enum AS ENUM ('rent_overdue', 'room_full', 'headcount');
    END IF;
END $$;

-- 2. Create tables
CREATE TABLE IF NOT EXISTS hostelers (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NULLABLE,
    permanent_address TEXT NOT NULL,
    emergency_contact_name VARCHAR(100) NOT NULL,
    emergency_contact_phone VARCHAR(20) NOT NULL,
    date_of_joining DATE NOT NULL,
    date_of_vacating DATE NULL,
    vacate_reason TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    photo_url VARCHAR(512) NULL,
    aadhaar_front_url VARCHAR(512) NULL,
    aadhaar_back_url VARCHAR(512) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    floor INTEGER NOT NULL,
    room_type room_type_enum NOT NULL,
    capacity INTEGER NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_assignments (
    id UUID PRIMARY KEY,
    hosteler_id UUID NOT NULL REFERENCES hostelers(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    bed_number INTEGER NOT NULL,
    assigned_date DATE NOT NULL,
    transferred_date DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS income (
    id UUID PRIMARY KEY,
    hosteler_id UUID NOT NULL REFERENCES hostelers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode payment_mode_enum NOT NULL,
    reference_number VARCHAR(100) NULL,
    receipt_url VARCHAR(512) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY,
    category expense_category_enum NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT NULL,
    receipt_photo_url VARCHAR(512) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY,
    asset_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    condition asset_condition_enum NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role staff_role_enum NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_logs (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    purpose TEXT NOT NULL,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_out TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    hosteler_id UUID NOT NULL REFERENCES hostelers(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status complaint_status_enum DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY,
    notification_type notification_type_enum NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def run_tenant_migrations(db_connection_url: str):
    """Programmatically initialize the dynamic tenant database using strict SQL DDL execution (Task 3.2)."""
    # Create a temporary engine connection targeting the new tenant database
    engine = create_engine(db_connection_url)
    
    logger.info("Initializing dynamic tenant schemas on connection URL...")
    
    # Split the DDL scripts to execute table creations
    statements = [stmt.strip() for stmt in TENANT_SCHEMA_DDL.split(";") if stmt.strip()]
    
    with engine.begin() as conn:
        # Enable UUID extension in the new database
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))
        
        for statement in statements:
            # Execute statement
            conn.execute(text(statement))
            
    logger.info("Dynamic tenant schema successfully provisioned.")
