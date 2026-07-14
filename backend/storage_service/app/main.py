import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.s3_helper import ensure_bucket_exists
from app.routers import storage_routes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="HostelMint Storage Service",
    description="Manages secure S3-compatible document uploads policies and short-lived retrieval URL generations.",
    version="1.0.0",
    docs_url="/api/v1/storage/docs",
    openapi_url="/api/v1/storage/openapi.json"
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
app.include_router(storage_routes.router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    logger.info("Initializing Storage Service S3 connections...")
    ensure_bucket_exists()

from app.schemas.api_schemas import HealthResponse

@app.get("/health", include_in_schema=False)
def health_check():
    return {"status": "healthy", "service": "storage_service"}
