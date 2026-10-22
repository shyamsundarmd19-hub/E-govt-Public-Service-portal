import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(1024), nullable=False)  # S3 Key or Presigned URL / Local storage path
    doc_type = Column(String(100), nullable=False)  # Identity Proof, Address Proof, Income Certificate, etc.
    file_size = Column(Integer, nullable=True)  # in bytes
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="documents")
