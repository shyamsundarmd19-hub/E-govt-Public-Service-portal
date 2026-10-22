import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    service_id = Column(String(36), ForeignKey("services.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(String(30), default="submitted", index=True, nullable=False)  # submitted, pending_verification, approved, rejected
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    assigned_to = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    remarks = Column(Text, nullable=True)
    applicant_data = Column(JSON, default=dict, nullable=True)

    # Relationships
    applicant = relationship("User", back_populates="applications", foreign_keys=[user_id])
    assigned_officer = relationship("User", back_populates="assigned_tasks", foreign_keys=[assigned_to])
    service = relationship("Service", back_populates="applications")
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    certificate = relationship("Certificate", back_populates="application", uselist=False, cascade="all, delete-orphan")
