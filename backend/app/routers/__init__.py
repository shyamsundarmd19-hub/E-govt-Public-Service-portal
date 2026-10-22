from app.routers.auth import router as auth_router
from app.routers.services import router as services_router
from app.routers.applications import router as applications_router
from app.routers.documents import router as documents_router
from app.routers.grievances import router as grievances_router
from app.routers.verify import router as verify_router
from app.routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "services_router",
    "applications_router",
    "documents_router",
    "grievances_router",
    "verify_router",
    "admin_router",
]
