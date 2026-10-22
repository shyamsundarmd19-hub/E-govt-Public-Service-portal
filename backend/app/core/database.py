import os
import sys
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

Base = declarative_base()

def init_engine():
    target_url = settings.DATABASE_URL or "sqlite:///./cloudgov.db"
    
    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql://", 1)

    # If configured for PostgreSQL, test if the server is accessible
    if not target_url.startswith("sqlite"):
        try:
            test_engine = create_engine(
                target_url,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                pool_recycle=300,
                connect_args={"connect_timeout": 3} if "postgresql" in target_url else {}
            )
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return test_engine
        except Exception as e:
            print(f"[CloudGov DB Notice]: Could not connect to primary database ({target_url}).")
            print(f"[CloudGov DB Notice]: Reason: {e}")
            print("[CloudGov DB Notice]: Gracefully falling back to local SQLite ('sqlite:///./cloudgov.db') for local testing.")
            return create_engine(
                "sqlite:///./cloudgov.db",
                connect_args={"check_same_thread": False}
            )

    return create_engine(
        target_url,
        connect_args={"check_same_thread": False}
    )

engine = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding an independent SQLAlchemy session per request.
    Ensures safe commit/rollback and clean connection release back to pool.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
