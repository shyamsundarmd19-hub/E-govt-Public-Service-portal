import os
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.application import Application
from app.models.document import Document
from app.models.user import User
from app.schemas.document import (
    DocumentCreate,
    DocumentResponse,
    PresignedUploadRequest,
    PresignedUploadResponse
)
from app.services.s3_service import s3_service, LOCAL_UPLOAD_DIR

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=PresignedUploadResponse)
def request_presigned_upload(
    req: PresignedUploadRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generates AWS S3 presigned PUT URL with SSE-S3 (AES256) server-side encryption.
    If AWS credentials are not set in .env, seamlessly falls back to local storage URL.
    """
    presigned_data = s3_service.generate_presigned_upload_url(
        file_name=req.file_name,
        doc_type=req.doc_type,
        content_type=req.content_type or "application/pdf"
    )
    return presigned_data


@router.post("/record", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def record_uploaded_document(
    doc_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Saves metadata for an uploaded document against an application."""
    app = db.query(Application).filter(Application.id == doc_in.application_id).first()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )

    document = Document(
        application_id=doc_in.application_id,
        file_name=doc_in.file_name,
        file_url=doc_in.file_url,
        doc_type=doc_in.doc_type,
        file_size=doc_in.file_size
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.post("/local-upload")
async def handle_local_upload(
    file_key: str = Query(..., description="Target file key identifier"),
    file: UploadFile = File(...)
):
    """Fallback endpoint for local uploads when AWS S3 is not yet connected."""
    safe_filename = os.path.basename(file_key)
    dest_path = os.path.join(LOCAL_UPLOAD_DIR, safe_filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "status": "success",
        "file_key": file_key,
        "filename": file.filename,
        "file_url": f"/api/v1/documents/download?file_key={file_key}"
    }


@router.get("/download")
def download_document(
    file_key: str = Query(..., description="S3 file key or local identifier"),
    db: Session = Depends(get_db)
):
    """Downloads or redirects to the requested vault document."""
    # If S3 is configured, redirect to presigned S3 download URL
    if s3_service.is_configured:
        url = s3_service.generate_presigned_download_url(file_key)
        return {"download_url": url}

    # Otherwise stream local file
    safe_filename = os.path.basename(file_key)
    local_path = os.path.join(LOCAL_UPLOAD_DIR, safe_filename)
    if not os.path.exists(local_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested document was not found in vault storage."
        )

    return FileResponse(
        path=local_path,
        media_type="application/octet-stream",
        filename=safe_filename
    )
