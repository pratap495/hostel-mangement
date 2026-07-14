import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.tenant_middleware import TenantRoutingMiddleware
from app.routers import finance_routes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="HostelMint Finance Service",
    description="Manages financial ledgers, expenditures, net profit summaries, and assets inventory under isolated tenant contexts.",
    version="1.0.0",
    docs_url="/api/v1/finance/docs",
    openapi_url="/api/v1/finance/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://admin.hostelmint.com",
        "http://localhost:3000",
        "*"
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

app.add_middleware(TenantRoutingMiddleware)

app.include_router(finance_routes.router, prefix="/api/v1")

from app.schemas.api_schemas import HealthResponse

@app.get("/health", include_in_schema=False)
def health_check():
    return {"status": "healthy", "service": "finance_service"}
