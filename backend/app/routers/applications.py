import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user, require_clerk_or_officer
from app.models.application import Application
from app.models.certificate import Certificate
from app.models.document import Document
from app.models.service import Service
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate
)
from app.services.audit_service import record_audit_log, send_notification
from app.services.certificate_service import certificate_service

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def submit_application(
    app_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Citizen submits an application for an e-Governance service."""
    # Verify service exists and is active
    service = db.query(Service).filter(Service.id == app_in.service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested government service is not found or is currently inactive."
        )

    # Generate unique application tracking number
    year = datetime.utcnow().year
    rand_id = random.randint(100000, 999999)
    app_number = f"CG-APP-{year}-{rand_id}"

    application = Application(
        application_number=app_number,
        user_id=current_user.id,
        service_id=service.id,
        status="submitted",
        applicant_data=app_in.applicant_data,
        remarks="Application submitted successfully. Awaiting clerk verification."
    )
    db.add(application)
    db.flush()

    # Link any documents provided in request
    if app_in.documents:
        for doc_item in app_in.documents:
            doc = Document(
                application_id=application.id,
                file_name=doc_item.get("file_name", "document.pdf"),
                file_url=doc_item.get("file_url", ""),
                doc_type=doc_item.get("doc_type", "General Attachment"),
                file_size=doc_item.get("file_size", 0)
            )
            db.add(doc)

    # Send Notification to Citizen
    send_notification(
        db=db,
        user_id=current_user.id,
        title="Application Submitted",
        message=f"Your application for {service.name} has been received. Tracking No: {app_number}",
        link=f"/applications/{application.id}"
    )

    # Record Audit Log
    record_audit_log(
        db=db,
        action="APPLICATION_SUBMITTED",
        user_id=current_user.id,
        details={
            "application_id": application.id,
            "application_number": app_number,
            "service_name": service.name
        }
    )

    db.commit()
    db.refresh(application)
    return application


@router.get("/", response_model=List[ApplicationResponse])
def list_applications(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by application status"),
    service_id: Optional[str] = Query(None, description="Filter by service"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List applications based on role:
    - Citizen: views only their submitted applications
    - Clerk/Officer/Admin: views desk queue or all applications with filtering
    """
    query = (
        db.query(Application)
        .options(
            joinedload(Application.service),
            joinedload(Application.applicant),
            joinedload(Application.documents),
            joinedload(Application.certificate)
        )
    )

    user_role = (current_user.role or "").lower()
    if user_role == "citizen":
        query = query.filter(Application.user_id == current_user.id)
    elif user_role in ["clerk", "officer"]:
        # Clerks and officers see applications assigned to them or unassigned in queue
        pass  # They can see the department queue

    if status_filter:
        query = query.filter(Application.status == status_filter)
    if service_id:
        query = query.filter(Application.service_id == service_id)

    return query.order_by(Application.submitted_at.desc()).all()


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application_details(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full application details, documents, and certificate."""
    application = (
        db.query(Application)
        .options(
            joinedload(Application.service),
            joinedload(Application.applicant),
            joinedload(Application.documents),
            joinedload(Application.certificate)
        )
        .filter(Application.id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )

    # Permission check: citizen can only view their own
    if current_user.role == "citizen" and application.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this application."
        )

    return application


@router.put("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: str,
    update_in: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clerk_or_officer)
):
    """
    Officer / Clerk workflow endpoint:
    - Transitions status: pending_verification, approved, rejected
    - When approved: triggers automated QR code & PDF Certificate generation
    """
    application = (
        db.query(Application)
        .options(
            joinedload(Application.service),
            joinedload(Application.applicant),
            joinedload(Application.certificate)
        )
        .filter(Application.id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )

    new_status = update_in.status.lower()
    valid_statuses = ["submitted", "pending_verification", "approved", "rejected"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{update_in.status}'. Allowed: {', '.join(valid_statuses)}"
        )

    old_status = application.status
    application.status = new_status
    if update_in.remarks:
        application.remarks = update_in.remarks
    if update_in.assigned_to:
        application.assigned_to = update_in.assigned_to
    else:
        application.assigned_to = current_user.id

    # AUTOMATED CERTIFICATE GENERATION TRIGGER ON APPROVAL
    if new_status == "approved" and not application.certificate:
        cert_data = certificate_service.issue_certificate_for_application(
            application_id=application.id,
            application_number=application.application_number,
            applicant_name=application.applicant.name if application.applicant else "Citizen",
            service_name=application.service.name if application.service else "Government Service",
            department=application.service.department if application.service else "General Administration"
        )

        certificate = Certificate(
            application_id=application.id,
            certificate_number=cert_data["certificate_number"],
            hash_signature=cert_data["hash_signature"],
            qr_code_url=cert_data["qr_code_url"],
            pdf_url=cert_data["pdf_url"],
            issued_at=cert_data["issued_at"],
            issuer_name=cert_data["issuer_name"]
        )
        db.add(certificate)

        # Notify citizen with certificate details
        send_notification(
            db=db,
            user_id=application.user_id,
            title="Application Approved & Certificate Issued!",
            message=(
                f"Your application {application.application_number} for {application.service.name} "
                f"has been approved. Certificate No: {certificate.certificate_number}"
            ),
            link=f"/verify/certificate/{certificate.certificate_number}"
        )

    elif new_status == "rejected":
        send_notification(
            db=db,
            user_id=application.user_id,
            title="Application Status Update",
            message=f"Your application {application.application_number} was rejected. Reason: {update_in.remarks or 'Document deficiency.'}",
            link=f"/applications/{application.id}"
        )
    else:
        send_notification(
            db=db,
            user_id=application.user_id,
            title="Application Under Verification",
            message=f"Application {application.application_number} is being processed by {current_user.name}.",
            link=f"/applications/{application.id}"
        )

    # Record Audit Log
    record_audit_log(
        db=db,
        action="APPLICATION_STATUS_UPDATED",
        user_id=current_user.id,
        details={
            "application_id": application.id,
            "old_status": old_status,
            "new_status": new_status,
            "remarks": update_in.remarks
        }
    )

    db.commit()
    db.refresh(application)
    return application
