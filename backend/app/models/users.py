"""
User & Persona Data Models (2.2, 6, 15)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from ..database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(120), unique=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(30), nullable=False)  # STUDENT|CR|HOSTEL_REP|CARETAKER|WARDEN|CHIEF_WARDEN|ESTATE_OFFICER|DIRECTOR|ADMIN
    hostel_id = Column(String(36), ForeignKey("hostels.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
