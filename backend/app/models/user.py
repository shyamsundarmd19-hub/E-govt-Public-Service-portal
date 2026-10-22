import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), default="citizen", nullable=False)  # citizen, clerk, officer, admin
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    applications = relationship("Application", back_populates="applicant", foreign_keys="Application.user_id")
    assigned_tasks = relationship("Application", back_populates="assigned_officer", foreign_keys="Application.assigned_to")
    grievances = relationship("Grievance", back_populates="citizen", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
