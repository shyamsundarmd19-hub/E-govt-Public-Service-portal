from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CertificateResponse(BaseModel):
    id: str
    application_id: str
    certificate_number: str
    hash_signature: str
    qr_code_url: str
    pdf_url: Optional[str] = None
    issued_at: datetime
    issuer_name: str

    class Config:
        from_attributes = True


class CertificateVerifyResponse(BaseModel):
    valid: bool
    status: str
    certificate_number: str
    hash_signature: str
    issued_at: Optional[datetime] = None
    service_name: Optional[str] = None
    applicant_name: Optional[str] = None
    issuer_name: Optional[str] = None
    application_number: Optional[str] = None
    message: str
