from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_admin
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate

router = APIRouter(prefix="/services", tags=["Services"])


@router.get("/", response_model=List[ServiceResponse])
def list_services(
    department: Optional[str] = Query(None, description="Filter by department"),
    active_only: bool = Query(True, description="Only show active public services"),
    db: Session = Depends(get_db)
):
    """List available government services."""
    query = db.query(Service)
    if active_only:
        query = query.filter(Service.is_active == True)
    if department:
        query = query.filter(Service.department.ilike(f"%{department}%"))
    
    return query.order_by(Service.name.asc()).all()


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service_by_id(service_id: str, db: Session = Depends(get_db)):
    """Fetch details and document prerequisites for a specific service."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Government service not found."
        )
    return service


@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: ServiceCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """Admin endpoint to create a new government service."""
    service = Service(
        name=service_in.name,
        department=service_in.department,
        description=service_in.description,
        required_documents=service_in.required_documents,
        sla_days=service_in.sla_days,
        is_active=service_in.is_active
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


def seed_default_services(db: Session):
    """Seeds baseline e-Governance services if none exist in database."""
    if db.query(Service).first():
        return

    default_services = [
        {
            "name": "Income Certificate",
            "department": "Revenue",
            "description": "Statutory certificate attesting annual household income for scholarship, subsidy, and tax benefits.",
            "required_documents": ["Aadhaar Card", "Salary Slip / IT Return", "Ration Card", "Affidavit of Income"],
            "sla_days": 7,
        },
        {
            "name": "Domicile & Residence Certificate",
            "department": "Revenue",
            "description": "Proof of continuous residence within the state required for state quota admissions and government recruitments.",
            "required_documents": ["Aadhaar Card", "Electricity Bill / Rent Agreement", "School Leaving Certificate", "Voter ID"],
            "sla_days": 10,
        },
        {
            "name": "Caste & Category Certificate",
            "department": "Social Welfare",
            "description": "Official certification verifying constitutional category status for affirmative action and scheme benefits.",
            "required_documents": ["Aadhaar Card", "Father's Caste Certificate", "School Record", "Genealogy Proof"],
            "sla_days": 14,
        },
        {
            "name": "Commercial Trade License",
            "department": "Municipal Corporation",
            "description": "Permit allowing commercial operations, retail business, or establishment within municipal jurisdiction.",
            "required_documents": ["PAN Card", "Property Tax Receipt / Lease Deed", "Fire Safety NOC", "Building Plan Approval"],
            "sla_days": 15,
        },
        {
            "name": "Birth Registration Certificate",
            "department": "Public Health",
            "description": "Official legal record of birth registration issued by the Registrar of Births and Deaths.",
            "required_documents": ["Hospital Discharge Summary", "Parents' Aadhaar Cards", "Marriage Certificate"],
            "sla_days": 5,
        },
        {
            "name": "Building Construction Permit",
            "department": "Urban Planning",
            "description": "Statutory clearance to begin civil structural construction or renovation in accordance with bylaws.",
            "required_documents": ["Title Deed", "Architectural Site Plan", "Structural Stability Certificate", "Environmental Clearance"],
            "sla_days": 21,
        }
    ]

    for item in default_services:
        service = Service(**item)
        db.add(service)
    db.commit()
