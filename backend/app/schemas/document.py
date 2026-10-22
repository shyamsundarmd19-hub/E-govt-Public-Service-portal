from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PresignedUploadRequest(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    doc_type: str = Field(..., description="Document type, e.g., Aadhaar, Income Proof, Address Proof")
    application_id: Optional[str] = None
    content_type: Optional[str] = "application/pdf"


class PresignedUploadResponse(BaseModel):
    upload_url: str
    file_key: str
    doc_type: str
    file_name: str
    s3_bucket: str
    is_direct_upload: bool = False


class DocumentCreate(BaseModel):
    application_id: str
    file_name: str
    file_url: str
    doc_type: str
    file_size: Optional[int] = None


class DocumentResponse(BaseModel):
    id: str
    application_id: str
    file_name: str
    file_url: str
    doc_type: str
    file_size: Optional[int] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True
