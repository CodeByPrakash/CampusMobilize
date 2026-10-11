"""
Performance, Reward, and Hostel Rating Models (§6, §11)
"""

import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Integer, Float, DateTime, Date, ForeignKey
from ..database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class PerformanceScore(Base):
    __tablename__ = "performance_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    hostel_id = Column(String(36), ForeignKey("hostels.id"), nullable=True)
    month = Column(Date, nullable=False)
    sla_compliance_pct = Column(Float, default=100.0)
    first_time_resolution_pct = Column(Float, default=100.0)
    avg_resolution_hours = Column(Float, default=0.0)
    rating_avg = Column(Float, default=5.0)
    performance_index = Column(Float, default=85.0)  # 0–100 (§11.1)
    hostel_rank = Column(Integer, default=1)
    created_at = Column(DateTime, default=get_utc_now)


class RewardLedger(Base):
    __tablename__ = "reward_ledger"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    month = Column(Date, nullable=False)
    kind = Column(String(50), nullable=False)        # certificate|incentive_recommendation|commendation
    status = Column(String(30), default="proposed")  # proposed|approved|awarded
    approved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    note = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)


class HostelRating(Base):
    __tablename__ = "hostel_ratings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hostel_id = Column(String(36), ForeignKey("hostels.id"), nullable=False)
    month = Column(Date, nullable=False)
    efficiency_rating = Column(Float, default=85.0)  # 0–100 (§11.3)
    resolution_time_score = Column(Float, default=80.0)
    per_resident_energy = Column(Float, default=95.0)
    per_resident_water = Column(Float, default=4.2)
    hygiene_audit_score = Column(Float, default=90.0)
    recurrence_penalty = Column(Float, default=0.0)
    campus_rank = Column(Integer, default=1)
    created_at = Column(DateTime, default=get_utc_now)
