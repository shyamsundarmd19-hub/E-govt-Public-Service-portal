from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models import User, Service, Application, Document, Grievance, Certificate, AuditLog, Notification
from app.routers import (
    auth_router,
    services_router,
    applications_router,
    documents_router,
    grievances_router,
    verify_router,
    admin_router,
)
from app.routers.services import seed_default_services


def seed_initial_demo_users(db: Session):
    """Creates default administrative, officer, and citizen credentials for initial testing."""
    demo_users = [
        {
            "name": "State Administrator",
            "email": "admin@cloudgov.gov",
            "phone": "+1-800-555-0100",
            "role": "admin",
            "password": "Admin@123"
        },
        {
            "name": "Verification Officer Sharma",
            "email": "officer@cloudgov.gov",
            "phone": "+1-800-555-0102",
            "role": "officer",
            "password": "Officer@123"
        },
        {
            "name": "Clerk Rajesh Kumar",
            "email": "clerk@cloudgov.gov",
            "phone": "+1-800-555-0103",
            "role": "clerk",
            "password": "Clerk@123"
        },
        {
            "name": "Priya Patel",
            "email": "citizen@cloudgov.gov",
            "phone": "+1-800-555-0104",
            "role": "citizen",
            "password": "Citizen@123"
        }
    ]

    for item in demo_users:
        existing = db.query(User).filter(User.email == item["email"]).first()
        if not existing:
            user = User(
                name=item["name"],
                email=item["email"],
                phone=item["phone"],
                role=item["role"],
                password_hash=get_password_hash(item["password"])
            )
            db.add(user)
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema is created
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed baseline services and demo users
    db = SessionLocal()
    try:
        seed_default_services(db)
        seed_initial_demo_users(db)
    finally:
        db.close()
    yield
    # Shutdown logic if any


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CloudGov e-Governance Platform API - Free Tier AWS Optimized Architecture (Direct Hosting)",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Setup
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register API v1 Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(services_router, prefix=api_v1_prefix)
app.include_router(applications_router, prefix=api_v1_prefix)
app.include_router(documents_router, prefix=api_v1_prefix)
app.include_router(grievances_router, prefix=api_v1_prefix)
app.include_router(verify_router, prefix=api_v1_prefix)
app.include_router(admin_router, prefix=api_v1_prefix)

# Also expose verify publicly directly at /verify for short QR code scans
app.include_router(verify_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }


@app.get("/api/health", tags=["Health"])
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "database": "connected"
    }
