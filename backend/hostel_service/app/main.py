import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.tenant_middleware import TenantRoutingMiddleware
from app.core.s3_helper import ensure_bucket_exists
from app.routers import room_routes, hosteler_routes

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI(
    title="HostelMint Hostel & Room Operations Service",
    description="Manages rooms, floor metadata, bed allocations, and resident profiles under isolated multi-tenant contexts.",
    version="1.0.0",
    docs_url="/api/v1/rooms/docs",
    openapi_url="/api/v1/rooms/openapi.json"
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

# Register Dynamic multi-tenant database router middleware (Task 3.1)
app.add_middleware(TenantRoutingMiddleware)

# Register routes with version prefix (Task 1.4)
app.include_router(room_routes.router, prefix="/api/v1")
app.include_router(hosteler_routes.router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    """Verify S3 secure file vault bucket existence on service startup (Task 1.2)."""
    logger.info("Initializing S3 Secure File storage vault connection...")
    ensure_bucket_exists()

@app.get("/health", tags=["System"])
def health_check():
    """Check API and system health status."""
    return {"status": "healthy", "service": "hostel_service"}
