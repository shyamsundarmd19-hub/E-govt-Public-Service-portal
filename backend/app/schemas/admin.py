from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class DepartmentMetric(BaseModel):
    department: str
    count: int


class StatusMetric(BaseModel):
    status: str
    count: int


class AnalyticsResponse(BaseModel):
    total_users: int
    total_citizens: int
    total_officers: int
    total_applications: int
    applications_by_status: List[StatusMetric]
    applications_by_department: List[DepartmentMetric]
    total_grievances: int
    grievances_by_status: List[StatusMetric]
    total_certificates_issued: int
    sla_compliance_rate: float
