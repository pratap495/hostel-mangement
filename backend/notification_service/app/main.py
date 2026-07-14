import asyncio
import json
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.tenant_middleware import TenantRoutingMiddleware
from app.core.websocket_manager import manager
from app.controllers.notification_controller import log_notification_to_db
from app.routers import notification_routes
from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="HostelMint Notification & Event Service",
    description="Subscribes to Redis events, stores notification logs, and broadcasts real-time WebSockets to dashboard clients.",
    version="1.0.0",
    docs_url="/api/v1/notifications/docs",
    openapi_url="/api/v1/notifications/openapi.json"
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

# Register tenant context switching middleware
app.add_middleware(TenantRoutingMiddleware)

# Register route mappings
app.include_router(notification_routes.router, prefix="/api/v1")

# Background thread/task listener logic for Redis pub/sub (Task 6.2)
async def redis_event_subscriber():
    """Background listener task subscribing to tenant event logs from Redis broker."""
    import redis.asyncio as aioredis
    logger.info("Initializing Redis event bus subscriber connection...")
    
    # Try connecting
    retry_delay = 2.0
    while True:
        try:
            r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            pubsub = r.pubsub()
            await pubsub.subscribe("tenant_events")
            logger.info("Successfully subscribed to Redis 'tenant_events' channel.")
            
            while True:
                try:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if message:
                        data = json.loads(message["data"])
                        hostel_id = data.get("hostel_id")
                        event_type = data.get("event_type")
                        payload = data.get("payload", {})
                        
                        logger.info(f"Received Redis Event: {event_type} for Hostel: {hostel_id}")
                        
                        # 1. Format user-friendly alert message
                        alert_msg = f"Event: {event_type.replace('_', ' ').title()}"
                        if event_type == "new_income":
                            alert_msg = f"Payment Received: INR {payload.get('amount')} from resident {payload.get('hosteler_name')}."
                        elif event_type == "room_full":
                            alert_msg = f"Alert: Room {payload.get('room_number')} has reached maximum bed capacity."
                        elif event_type == "rent_overdue":
                            alert_msg = f"Payment Warning: Resident {payload.get('hosteler_name')} rent is overdue."
                            
                        # 2. Write event to tenant database (Task 6.1)
                        log_notification_to_db(hostel_id, event_type, alert_msg)
                        
                        # 3. Broadcast real-time WebSockets to dashboard client (Task 6.3)
                        await manager.broadcast_to_hostel(hostel_id, {
                            "event": event_type,
                            "message": alert_msg,
                            "payload": payload
                        })
                except Exception as e:
                    logger.error(f"Error reading message from Redis pub/sub: {e}")
                    await asyncio.sleep(1.0)
        except Exception as e:
            logger.error(f"Redis event bus connection failed: {e}. Retrying in {retry_delay}s...")
            await asyncio.sleep(retry_delay)

@app.on_event("startup")
def on_startup():
    """Startup task initiating background Redis pubsub subscription task."""
    loop = asyncio.get_event_loop()
    loop.create_task(redis_event_subscriber())

from app.schemas.api_schemas import HealthResponse

@app.get("/health", include_in_schema=False)
def health_check():
    return {"status": "healthy", "service": "notification_service"}
