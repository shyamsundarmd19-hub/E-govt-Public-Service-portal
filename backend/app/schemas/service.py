from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ServiceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    department: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    required_documents: List[str] = Field(default_factory=list)
    sla_days: int = Field(default=7, ge=1, le=90)
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    required_documents: Optional[List[str]] = None
    sla_days: Optional[int] = None
    is_active: Optional[bool] = None


class ServiceResponse(ServiceBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
