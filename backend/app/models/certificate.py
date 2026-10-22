import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), unique=True, nullable=False)
    certificate_number = Column(String(100), unique=True, index=True, nullable=False)
    hash_signature = Column(String(256), nullable=False)  # Cryptographic SHA-256 digest
    qr_code_url = Column(Text, nullable=False)  # Data URL or S3 URL
    pdf_url = Column(Text, nullable=True)  # Downloadable PDF URL or S3 key
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    issuer_name = Column(String(255), default="Government of Digital State", nullable=False)

    # Relationships
    application = relationship("Application", back_populates="certificate")
