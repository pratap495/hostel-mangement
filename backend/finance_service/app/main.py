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

app.add_middleware(TenantRoutingMiddleware)

app.include_router(finance_routes.router, prefix="/api/v1")

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "service": "finance_service"}
