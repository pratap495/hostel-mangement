import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models.db_models import SuperAdmin
from app.core.security import get_password_hash
from app.routers import auth_routes, tenant_routes

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI(
    title="HostelMint Authentication & Tenant Service",
    description="Manages authentication, owner profiles, audit logs, and dynamic database provisioning for HostelMint.",
    version="1.0.0",
    docs_url="/api/v1/auth/docs",
    openapi_url="/api/v1/auth/openapi.json"
)

# Configure CORS Middleware (Task 1.5)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://admin.hostelmint.com",
        "http://localhost:3000",
        "*" # Allow local React Native testing
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Hostel-ID"],
)

# Register routes with version prefix (Task 1.4)
app.include_router(auth_routes.router, prefix="/api/v1")
app.include_router(tenant_routes.router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    """Ensure database schemas exist and seed default Super Admin credentials on deployment (Task 2.6)."""
    logger.info("Initializing Central Admin DB schemas...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if default Super Admin is seeded
        default_admin = db.query(SuperAdmin).filter(SuperAdmin.email == "superadmin@hostelmint.com").first()
        if not default_admin:
            logger.info("Seeding default Super Admin account (superadmin@hostelmint.com)...")
            admin_user = SuperAdmin(
                email="superadmin@hostelmint.com",
                password_hash=get_password_hash("SecurePassword123"),
                force_password_reset=True
            )
            db.add(admin_user)
            db.commit()
            logger.info("Default Super Admin seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding central database schemas: {e}")
    finally:
        db.close()

@app.get("/health", tags=["System"])
def health_check():
    """Check API and system health status."""
    return {"status": "healthy", "service": "auth_service"}
