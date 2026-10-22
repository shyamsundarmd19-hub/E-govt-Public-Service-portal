import os
import uuid
from typing import Dict, Any, Optional
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from app.core.config import settings

# Local storage fallback directory
LOCAL_UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)


class S3VaultService:
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.region = settings.AWS_REGION
        self.is_configured = bool(
            settings.AWS_ACCESS_KEY_ID and 
            settings.AWS_SECRET_ACCESS_KEY and
            settings.AWS_ACCESS_KEY_ID != "your-aws-access-key-id"
        )
        
        if self.is_configured:
            self.s3_client = boto3.client(
                "s3",
                region_name=self.region,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4")
            )
        else:
            self.s3_client = None

    def generate_presigned_upload_url(
        self,
        file_name: str,
        doc_type: str,
        content_type: str = "application/pdf",
        expires_in: int = 3600
    ) -> Dict[str, Any]:
        """
        Generates an AWS S3 presigned PUT URL with SSE-S3 encryption.
        Falls back to local mock URL if AWS credentials are not yet configured.
        """
        # Sanitize and namespace file key
        safe_name = os.path.basename(file_name)
        file_key = f"vault/{doc_type.lower().replace(' ', '_')}/{uuid.uuid4().hex[:8]}_{safe_name}"

        if self.is_configured and self.s3_client:
            try:
                # Generate Presigned PUT URL with Server-Side Encryption (AES256)
                presigned_url = self.s3_client.generate_presigned_url(
                    ClientMethod="put_object",
                    Params={
                        "Bucket": self.bucket_name,
                        "Key": file_key,
                        "ContentType": content_type,
                        "ServerSideEncryption": "AES256"
                    },
                    ExpiresIn=expires_in
                )
                return {
                    "upload_url": presigned_url,
                    "file_key": file_key,
                    "doc_type": doc_type,
                    "file_name": safe_name,
                    "s3_bucket": self.bucket_name,
                    "is_direct_upload": False
                }
            except ClientError as e:
                print(f"[S3 Presign Error]: {e}")

        # Local storage / mock fallback
        mock_upload_url = f"/api/v1/documents/local-upload?file_key={file_key}"
        return {
            "upload_url": mock_upload_url,
            "file_key": file_key,
            "doc_type": doc_type,
            "file_name": safe_name,
            "s3_bucket": self.bucket_name or "local-storage-vault",
            "is_direct_upload": True
        }

    def generate_presigned_download_url(self, file_key: str, expires_in: int = 3600) -> str:
        """Generates a secure presigned download link for viewing documents."""
        if self.is_configured and self.s3_client:
            try:
                return self.s3_client.generate_presigned_url(
                    ClientMethod="get_object",
                    Params={"Bucket": self.bucket_name, "Key": file_key},
                    ExpiresIn=expires_in
                )
            except ClientError as e:
                print(f"[S3 Download Error]: {e}")
        
        # Local fallback file path or URL
        return f"/api/v1/documents/download?file_key={file_key}"


s3_service = S3VaultService()
