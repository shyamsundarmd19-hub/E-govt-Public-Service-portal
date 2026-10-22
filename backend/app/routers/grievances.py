import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user, require_clerk_or_officer
from app.models.grievance import Grievance
from app.models.user import User
from app.schemas.grievance import (
    GrievanceCreate,
    GrievanceResponse,
    GrievanceStatusUpdate
)
from app.services.audit_service import record_audit_log, send_notification

router = APIRouter(prefix="/grievances", tags=["Grievances"])


@router.post("/", response_model=GrievanceResponse, status_code=status.HTTP_201_CREATED)
def submit_grievance(
    grievance_in: GrievanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lodge a public grievance with Department routing and priority tagging."""
    year = datetime.utcnow().year
    rand_id = random.randint(100000, 999999)
    grv_number = f"CG-GRV-{year}-{rand_id}"

    grievance = Grievance(
        grievance_number=grv_number,
        user_id=current_user.id,
        department=grievance_in.department,
        subject=grievance_in.subject or f"Grievance regarding {grievance_in.department}",
        description=grievance_in.description,
        priority=grievance_in.priority.lower(),
        status="open"
    )
    db.add(grievance)

    # Citizen notification
    send_notification(
        db=db,
        user_id=current_user.id,
        title="Grievance Registered",
        message=f"Grievance {grv_number} for {grievance.department} has been logged.",
        link=f"/grievances/{grievance.id}"
    )

    # Audit Log
    record_audit_log(
        db=db,
        action="GRIEVANCE_LODGED",
        user_id=current_user.id,
        details={
            "grievance_number": grv_number,
            "department": grievance.department,
            "priority": grievance.priority
        }
    )

    db.commit()
    db.refresh(grievance)
    return grievance


@router.get("/", response_model=List[GrievanceResponse])
def list_grievances(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    department: Optional[str] = Query(None, description="Filter by department"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List grievances:
    - Citizen: views only their grievances
    - Officer/Admin: views grievances filtered by status or department
    """
    query = db.query(Grievance).options(joinedload(Grievance.citizen))

    user_role = (current_user.role or "").lower()
    if user_role == "citizen":
        query = query.filter(Grievance.user_id == current_user.id)

    if status_filter:
        query = query.filter(Grievance.status == status_filter.lower())
    if department:
        query = query.filter(Grievance.department.ilike(f"%{department}%"))

    return query.order_by(Grievance.created_at.desc()).all()


@router.put("/{grievance_id}/status", response_model=GrievanceResponse)
def update_grievance_status(
    grievance_id: str,
    update_in: GrievanceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_clerk_or_officer)
):
    """Officer resolves or updates the status of a citizen grievance."""
    grievance = db.query(Grievance).filter(Grievance.id == grievance_id).first()
    if not grievance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grievance not found."
        )

    valid_statuses = ["open", "in_progress", "resolved"]
    new_status = update_in.status.lower()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{new_status}'. Allowed: {', '.join(valid_statuses)}"
        )

    grievance.status = new_status
    if update_in.resolution_remarks:
        grievance.resolution_remarks = update_in.resolution_remarks

    send_notification(
        db=db,
        user_id=grievance.user_id,
        title=f"Grievance {grievance.status.capitalize()}",
        message=f"Grievance {grievance.grievance_number} is now {new_status}. {grievance.resolution_remarks or ''}",
        link=f"/grievances/{grievance.id}"
    )

    record_audit_log(
        db=db,
        action="GRIEVANCE_STATUS_UPDATED",
        user_id=current_user.id,
        details={
            "grievance_id": grievance.id,
            "grievance_number": grievance.grievance_number,
            "status": new_status
        }
    )

    db.commit()
    db.refresh(grievance)
    return grievance
