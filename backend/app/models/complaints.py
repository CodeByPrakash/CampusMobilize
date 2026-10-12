"""
Complaints, Categories, SLA Policies, and Events Models (3, 6)
"""

import uuid
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class Category(Base):
    __tablename__ = "categories"

    code = Column(String(30), primary_key=True)  # ELECTRICAL, WATER, HYGIENE, CIVIL, SECURITY, MISC
    name = Column(String(100), nullable=False)
    default_severity = Column(Integer, default=3)
    sla_class = Column(String(10), default="P3")  # P1|P2|P3|P4


class SlaPolicy(Base):
    __tablename__ = "sla_policies"

    priority = Column(String(10), primary_key=True)  # P1|P2|P3|P4
    sla_hours = Column(Integer, nullable=False)
    warning_at_pct = Column(Integer, default=75)
    p1_escalation_minutes = Column(Integer, default=45)


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ticket_no = Column(String(30), unique=True, nullable=False)  # CIQ-2026-00001
    title = Column(String(200), nullable=False)
    description = Column(String(2000), nullable=False)
    category_code = Column(String(30), ForeignKey("categories.code"), nullable=False)
    hostel_id = Column(String(36), ForeignKey("hostels.id"), nullable=True)
    block_id = Column(String(36), ForeignKey("blocks.id"), nullable=True)
    room_id = Column(String(36), ForeignKey("rooms.id"), nullable=True)
    location_text = Column(String(200), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    reported_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    reported_for = Column(String(36), ForeignKey("users.id"), nullable=True)  # CR filing on behalf
    parent_complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=True)

    # State machine status (3)
    status = Column(String(30), default="OPEN", nullable=False)
    # OPEN, VERIFIED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REJECTED, REJECTED_BACK, REASSIGNED, ESCALATED

    priority = Column(String(10), default="P3", nullable=False)  # P1|P2|P3|P4
    severity = Column(Integer, default=3, nullable=False)        # 1 to 5

    # AI engine outputs
    risk_score = Column(Float, nullable=True)
    risk_explanation = Column(String(1000), nullable=True)
    ranking_score = Column(Float, nullable=True)
    queue_rank = Column(Integer, nullable=True)
    duplicate_of = Column(String(36), ForeignKey("complaints.id"), nullable=True)
    ai_category_confidence = Column(Float, nullable=True)

    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    sla_deadline = Column(DateTime, nullable=True)
    verified_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    closed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    resolution_note = Column(String(1000), nullable=True)
    resolution_photo_url = Column(String(500), nullable=True)
    people_affected = Column(Integer, default=1)
    upvote_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=get_utc_now)

    events = relationship("ComplaintEvent", back_populates="complaint", cascade="all, delete-orphan")
    hostel = relationship("Hostel", foreign_keys=[hostel_id])
    block = relationship("Block", foreign_keys=[block_id])
    room = relationship("Room", foreign_keys=[room_id])
    assigned_user = relationship("User", foreign_keys=[assigned_to])

    @property
    def hostel_code(self) -> Optional[str]:
        return self.hostel.code if self.hostel else None

    @property
    def block_name(self) -> Optional[str]:
        return self.block.name if self.block else None

    @property
    def room_no(self) -> Optional[str]:
        return self.room.room_no if self.room else None

    @property
    def assigned_to_name(self) -> Optional[str]:
        return self.assigned_user.full_name if self.assigned_user else None



class ComplaintEvent(Base):
    __tablename__ = "complaint_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=False)
    from_status = Column(String(30), nullable=True)
    to_status = Column(String(30), nullable=False)
    actor_id = Column(String(64), nullable=True)
    actor_role = Column(String(30), nullable=True)
    note = Column(String(1000), nullable=True)
    photo_url = Column(String(500), nullable=True)
    meta = Column(JSON, default=dict)
    created_at = Column(DateTime, default=get_utc_now)

    complaint = relationship("Complaint", back_populates="events")


class ComplaintMedia(Base):
    __tablename__ = "complaint_media"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_kind = Column(String(20), default="image")
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)


class ComplaintUpvote(Base):
    __tablename__ = "complaint_upvotes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=get_utc_now)
