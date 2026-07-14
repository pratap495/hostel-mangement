import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.tenant_middleware import TenantRoutingMiddleware
from app.core.s3_helper import ensure_bucket_exists
from app.routers import room_routes, hosteler_routes

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from fastapi.openapi.docs import get_swagger_ui_html

# Initialize FastAPI application
app = FastAPI(
    title="HostelMint Hostel & Room Operations Service",
    description="Manages rooms, floor metadata, bed allocations, and resident profiles under isolated multi-tenant contexts.",
    version="1.0.0",
    docs_url=None,  # Disabled to use Cloudflare CDN override below
    openapi_url="/api/v1/rooms/openapi.json"
)

@app.get("/api/v1/rooms/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/api/v1/rooms/openapi.json",
        title=app.title + " - Swagger UI",
        swagger_js_url="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.9.0/swagger-ui.css"
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

from fastapi.exceptions import RequestValidationError
from starlette.requests import Request
from starlette.responses import JSONResponse

# Custom exception handlers for user-friendly error responses
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error.get("loc", []) if loc != "body")
        msg = error.get("msg", "invalid input")
        if field:
            errors.append(f"'{field}' {msg}")
        else:
            errors.append(msg)
    friendly_msg = "Validation failed: " + "; ".join(errors)
    return JSONResponse(
        status_code=422,
        content={"detail": friendly_msg}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled system error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again later."}
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

from app.schemas.api_schemas import HealthResponse

@app.get("/health", include_in_schema=False)
def health_check():
    """Check API and system health status."""
    return {"status": "healthy", "service": "hostel_service"}
