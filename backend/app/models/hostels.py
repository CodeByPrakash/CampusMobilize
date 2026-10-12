"""
Hostel & Physical Facilities Data Models (6)
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class Hostel(Base):
    __tablename__ = "hostels"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(20), unique=True, nullable=False)  # 'HB-3', 'KMS', 'CVR', 'GDB'
    name = Column(String(100), nullable=False)
    type = Column(String(30), default="boys")               # boys|girls|married|international
    resident_count = Column(Integer, default=0)
    warden_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    blocks = relationship("Block", back_populates="hostel", cascade="all, delete-orphan")


class Block(Base):
    __tablename__ = "blocks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hostel_id = Column(String(36), ForeignKey("hostels.id"), nullable=False)
    name = Column(String(100), nullable=False)              # 'A Block', 'Pump Room Area'
    kind = Column(String(50), default="residential")        # residential|utility|common
    created_at = Column(DateTime, default=get_utc_now)

    hostel = relationship("Hostel", back_populates="blocks")
    rooms = relationship("Room", back_populates="block", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    block_id = Column(String(36), ForeignKey("blocks.id"), nullable=False)
    room_no = Column(String(20), nullable=False)            # '214', '101'
    created_at = Column(DateTime, default=get_utc_now)

    block = relationship("Block", back_populates="rooms")


class CaretakerSkill(Base):
    __tablename__ = "caretaker_skills"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    skill = Column(String(50), nullable=False)              # electrical|plumbing|civil|housekeeping
    proficiency = Column(Integer, default=3)                # 1 to 5
    created_at = Column(DateTime, default=get_utc_now)
