import contextvars
import logging
from typing import Dict
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import sessionmaker
from .database import Base, CentralSession

logger = logging.getLogger(__name__)

tenant_session_var: contextvars.ContextVar = contextvars.ContextVar("tenant_session")
engine_cache: Dict[str, any] = {}

class CentralTenantRegistry(Base):
    __tablename__ = "tenant_databases"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    hostel_id = Column(UUID(as_uuid=True), unique=True, nullable=False)
    db_name = Column(String(100), nullable=False)
    db_host = Column(String(150), nullable=False)
    db_port = Column(Integer, nullable=False)
    db_username = Column(String(100), nullable=False)
    db_password_hash = Column(String(255), nullable=False)

def get_tenant_db():
    try:
        return tenant_session_var.get()
    except LookupError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tenant database context is not initialized."
        )

class TenantRoutingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        
        # Bypass WS route so it can pass headers in query params or connect directly
        if path in ["/health", "/api/v1/notifications/docs", "/api/v1/notifications/openapi.json"] or "/ws/" in path:
            return await call_next(request)
            
        hostel_id = request.headers.get("X-Hostel-ID")
        if not hostel_id:
            return Response(
                content='{"detail": "Missing X-Hostel-ID header required for multi-tenant context."}',
                status_code=status.HTTP_400_BAD_REQUEST,
                media_type="application/json"
            )
            
        engine_str = engine_cache.get(hostel_id)
        if not engine_str:
            central_db = CentralSession()
            try:
                registry = central_db.query(CentralTenantRegistry).filter(
                    CentralTenantRegistry.hostel_id == hostel_id
                ).first()
                
                if not registry:
                    return Response(
                        content='{"detail": "Tenant database mapping not found for this Hostel ID."}',
                        status_code=status.HTTP_404_NOT_FOUND,
                        media_type="application/json"
                    )
                
                connection_url = f"postgresql://{registry.db_username}:{registry.db_password_hash}@{registry.db_host}:{registry.db_port}/{registry.db_name}"
                engine = create_engine(
                    connection_url,
                    pool_size=10,
                    max_overflow=20,
                    pool_pre_ping=True
                )
                engine_cache[hostel_id] = engine
                logger.info(f"Engine cached for tenant: {hostel_id}")
            except Exception as e:
                logger.error(f"Error reading tenant registry: {e}")
                return Response(
                    content='{"detail": "Failed to read tenant database connection registry."}',
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    media_type="application/json"
                )
            finally:
                central_db.close()
                
        tenant_engine = engine_cache[hostel_id]
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=tenant_engine)
        session = SessionLocal()
        
        token = tenant_session_var.set(session)
        try:
            response = await call_next(request)
            session.commit()
            return response
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
            tenant_session_var.reset(token)
