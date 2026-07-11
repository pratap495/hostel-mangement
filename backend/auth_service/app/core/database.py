from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# Connect to Central Admin DB
engine = create_engine(
    settings.CENTRAL_DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to yield Central database sessions
def get_admin_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
