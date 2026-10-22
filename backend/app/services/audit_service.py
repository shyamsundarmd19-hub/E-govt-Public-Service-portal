from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.notification import Notification


def record_audit_log(
    db: Session,
    action: str,
    user_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """Creates an immutable audit trail entry."""
    log = AuditLog(
        user_id=user_id,
        action=action,
        details=details or {},
        ip_address=ip_address
    )
    db.add(log)
    db.flush()
    return log


def send_notification(
    db: Session,
    user_id: str,
    title: str,
    message: str,
    link: Optional[str] = None
) -> Notification:
    """Dispatches an in-platform notification to a user."""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        link=link
    )
    db.add(notification)
    db.flush()
    return notification
