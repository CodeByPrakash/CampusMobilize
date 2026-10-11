"""
Notification & Audit Email Log Models (§6, §10)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from ..database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    kind = Column(String(50), nullable=False)  # p1_urgent|sla_warning|escalated|resolved|closed
    title = Column(String(200), nullable=False)
    body = Column(String(1000), nullable=True)
    link = Column(String(200), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)


class EmailLog(Base):
    __tablename__ = "email_log"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    template = Column(String(50), nullable=False)
    to_emails = Column(String(500), nullable=False)
    cc_emails = Column(String(500), nullable=True)
    subject = Column(String(300), nullable=False)
    body = Column(String(4000), nullable=False)
    status = Column(String(30), default="sent")  # queued|sent|failed|disabled_dev
    sent_at = Column(DateTime, default=get_utc_now)
    created_at = Column(DateTime, default=get_utc_now)
