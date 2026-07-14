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

from fastapi.openapi.docs import get_swagger_ui_html

# Initialize FastAPI application
app = FastAPI(
    title="HostelMint Authentication & Tenant Service",
    description="Manages authentication, owner profiles, audit logs, and dynamic database provisioning for HostelMint.",
    version="1.0.0",
    docs_url=None,  # Disabled to use Cloudflare CDN override below
    openapi_url="/api/v1/auth/openapi.json"
)

from fastapi.responses import HTMLResponse

@app.get("/api/v1/auth/docs", include_in_schema=False, response_class=HTMLResponse)
async def custom_swagger_ui_html():
    unified_swagger_html = """
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <title>HostelMint Unified API Hub - Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.9.0/swagger-ui.css">
    <link rel="shortcut icon" href="https://fastapi.tiangolo.com/img/favicon.png">
    <style>
        html { box-sizing: border-box; overflow: -y-scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; font-family: sans-serif; }
        .topbar { background-color: #1a1a1a; padding: 12px 24px; color: white; display: flex; align-items: center; justify-content: space-between; }
        .topbar-title { font-size: 20px; font-weight: bold; }
        .service-selector { padding: 8px 16px; font-size: 14px; border-radius: 4px; border: 1px solid #444; background-color: #2a2a2a; color: white; cursor: pointer; outline: none; }
        .service-selector:hover { background-color: #3a3a3a; }
    </style>
    </head>
    <body>
    <div class="topbar">
        <div class="topbar-title">HostelMint Unified API Hub</div>
        <select class="service-selector" id="service-select">
            <option value="/api/v1/auth/openapi.json">1. Auth & Onboarding Service</option>
            <option value="/api/v1/rooms/openapi.json">2. Hostel & Room Service</option>
            <option value="/api/v1/finance/openapi.json">3. Finance & Inventory Service</option>
            <option value="/api/v1/storage/openapi.json">4. Secure Storage Service</option>
            <option value="/api/v1/notifications/openapi.json">5. Notifications & Event Service</option>
        </select>
    </div>
    <div id="swagger-ui"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.9.0/swagger-ui-bundle.js"></script>
    <script>
        // Get URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        let currentUrl = urlParams.get('url') || "/api/v1/auth/openapi.json";
        
        // Update select value
        document.getElementById('service-select').value = currentUrl;
        
        // Bind change handler programmatically to avoid CSP inline event violations
        document.getElementById('service-select').addEventListener('change', function(e) {
            window.location.search = `?url=${encodeURIComponent(e.target.value)}`;
        });

        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: currentUrl,
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis
                ],
                layout: "BaseLayout"
            });
            window.ui = ui;
        };
    </script>
    </body>
    </html>
    """
    return HTMLResponse(content=unified_swagger_html, status_code=200)

from fastapi.exceptions import RequestValidationError
from starlette.requests import Request
from starlette.responses import JSONResponse

# Custom exception handlers for user-friendly error responses
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        # Clean up field location path (e.g. skip "body")
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

from app.schemas.api_schemas import HealthResponse

@app.get("/health", include_in_schema=False)
def health_check():
    """Check API and system health status."""
    return {"status": "healthy", "service": "auth_service"}
