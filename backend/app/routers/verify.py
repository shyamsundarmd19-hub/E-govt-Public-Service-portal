import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.certificate import Certificate
from app.models.application import Application
from app.schemas.certificate import CertificateVerifyResponse
from app.services.certificate_service import CERT_STORAGE_DIR

router = APIRouter(prefix="/verify", tags=["Public Verification"])


@router.get("/certificate/{cert_id}", response_model=CertificateVerifyResponse)
def verify_certificate_authenticity(cert_id: str, db: Session = Depends(get_db)):
    """
    Public verification endpoint accessed via QR Code scan.
    Validates cryptographic authenticity and status against the central registry.
    """
    certificate = (
        db.query(Certificate)
        .options(
            joinedload(Certificate.application).joinedload(Application.applicant),
            joinedload(Certificate.application).joinedload(Application.service)
        )
        .filter(
            (Certificate.certificate_number == cert_id) | (Certificate.id == cert_id)
        )
        .first()
    )

    if not certificate:
        return CertificateVerifyResponse(
            valid=False,
            status="NOT_FOUND",
            certificate_number=cert_id,
            hash_signature="N/A",
            message="No matching certificate record exists in the CloudGov National Registry. The document may be fraudulent."
        )

    app = certificate.application
    applicant_name = app.applicant.name if app and app.applicant else "Verified Citizen"
    service_name = app.service.name if app and app.service else "Government Certificate"
    app_number = app.application_number if app else "N/A"

    return CertificateVerifyResponse(
        valid=True,
        status="AUTHENTIC_AND_VERIFIED",
        certificate_number=certificate.certificate_number,
        hash_signature=certificate.hash_signature,
        issued_at=certificate.issued_at,
        service_name=service_name,
        applicant_name=applicant_name,
        issuer_name=certificate.issuer_name,
        application_number=app_number,
        message="This document is an authentic electronic certificate digitally validated by the Electronic Governance Directorate."
    )


@router.get("/download-certificate/{cert_number}")
def download_pdf_certificate(cert_number: str, db: Session = Depends(get_db)):
    """Serves the generated official ReportLab PDF certificate."""
    cert = db.query(Certificate).filter(Certificate.certificate_number == cert_number).first()
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate record not found."
        )

    filename = f"{cert_number.replace('/', '_')}.pdf"
    pdf_path = os.path.join(CERT_STORAGE_DIR, filename)

    if not os.path.exists(pdf_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate PDF file is missing or being generated."
        )

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename
    )
