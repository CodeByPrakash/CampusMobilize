"""
Utility Bills, Events, and Forecasts Data Models (§6)
"""

import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Integer, Float, DateTime, Date, ForeignKey
from ..database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class UtilityBill(Base):
    __tablename__ = "utility_bills"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hostel_id = Column(String(36), ForeignKey("hostels.id"), nullable=True)  # NULL = campus-wide
    utility = Column(String(30), nullable=False)                            # electricity|water
    bill_month = Column(Date, nullable=False)
    units_consumed = Column(Float, nullable=False)                          # kWh or kL
    amount_inr = Column(Float, nullable=False)
    tariff_rate = Column(Float, nullable=True)
    source_file_url = Column(String(500), nullable=True)
    parsed_confidence = Column(Float, default=1.0)
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)


class CampusEvent(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(150), nullable=False)                              # Innovision, Nitrutsav, Exams
    kind = Column(String(50), nullable=False)                              # festival|techfest|exam|convocation
    starts_on = Column(Date, nullable=False)
    ends_on = Column(Date, nullable=False)
    expected_footfall = Column(Integer, default=0)
    water_surge_multiplier = Column(Float, default=1.0)
    electricity_surge_multiplier = Column(Float, default=1.0)
    hygiene_pressure_multiplier = Column(Float, default=1.0)
    declared_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)


class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scope = Column(String(50), nullable=False)                              # hostel_id or 'campus'
    utility = Column(String(30), nullable=False)                            # electricity|water
    target_month = Column(Date, nullable=False)
    predicted_units = Column(Float, nullable=False)
    lower_ci = Column(Float, nullable=True)
    upper_ci = Column(Float, nullable=True)
    model_version = Column(String(50), default="v1.0")
    event_id = Column(String(36), ForeignKey("events.id"), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
