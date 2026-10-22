from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.service import ServiceResponse
from app.schemas.document import DocumentResponse
from app.schemas.certificate import CertificateResponse


class ApplicationBase(BaseModel):
    service_id: str
    applicant_data: Dict[str, Any] = Field(default_factory=dict)


class ApplicationCreate(ApplicationBase):
    documents: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="List of uploaded documents info")


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., description="Target status: pending_verification, approved, rejected")
    remarks: Optional[str] = None
    assigned_to: Optional[str] = None


class ApplicantSummary(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class ApplicationResponse(BaseModel):
    id: str
    application_number: str
    user_id: str
    service_id: str
    status: str
    submitted_at: datetime
    updated_at: datetime
    assigned_to: Optional[str] = None
    remarks: Optional[str] = None
    applicant_data: Optional[Dict[str, Any]] = None
    
    # Nested relations
    service: Optional[ServiceResponse] = None
    applicant: Optional[ApplicantSummary] = None
    documents: List[DocumentResponse] = Field(default_factory=list)
    certificate: Optional[CertificateResponse] = None

    class Config:
        from_attributes = True
