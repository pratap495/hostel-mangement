from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# Central engine to read tenant metadata connection registry
central_engine = create_engine(
    settings.CENTRAL_DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True
)

CentralSession = sessionmaker(bind=central_engine)
Base = declarative_base()
