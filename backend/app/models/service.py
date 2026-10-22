import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, JSON, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    required_documents = Column(JSON, default=list, nullable=False)  # ["Aadhaar", "Income Proof", ...]
    sla_days = Column(Integer, default=7, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    applications = relationship("Application", back_populates="service")
