import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    grievance_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    subject = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="medium", nullable=False)  # low, medium, high, urgent
    status = Column(String(20), default="open", index=True, nullable=False)  # open, in_progress, resolved
    resolution_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    citizen = relationship("User", back_populates="grievances")
