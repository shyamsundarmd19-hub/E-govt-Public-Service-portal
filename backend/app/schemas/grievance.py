from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse


class GrievanceBase(BaseModel):
    department: str = Field(..., min_length=2, max_length=100)
    subject: Optional[str] = Field(None, max_length=255)
    description: str = Field(..., min_length=10)
    priority: str = Field("medium", description="Priority: low, medium, high, urgent")


class GrievanceCreate(GrievanceBase):
    pass


class GrievanceStatusUpdate(BaseModel):
    status: str = Field(..., description="Target status: open, in_progress, resolved")
    resolution_remarks: Optional[str] = None


class GrievanceResponse(GrievanceBase):
    id: str
    grievance_number: str
    user_id: str
    status: str
    resolution_remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    citizen: Optional[UserResponse] = None

    class Config:
        from_attributes = True
