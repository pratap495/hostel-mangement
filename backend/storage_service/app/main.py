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

app.include_router(storage_routes.router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    logger.info("Initializing Storage Service S3 connections...")
    ensure_bucket_exists()

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "service": "storage_service"}
