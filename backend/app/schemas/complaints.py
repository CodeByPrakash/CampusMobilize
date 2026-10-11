"""
Pydantic Schemas for Complaints and State Machine Events (§7.3, §7.4)
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=5, max_length=2000)
    category_code: Optional[str] = "AUTO"  # AUTO triggers AI classification
    priority: Optional[str] = None         # P1|P2|P3|P4 (e.g. emergency hotline or warden intake)
    hostel_code: Optional[str] = "HB-3"
    hostel_id: Optional[str] = None
    block_id: Optional[str] = None
    block_name: Optional[str] = None
    room_id: Optional[str] = None
    room_no: Optional[str] = None
    location_text: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    severity: Optional[int] = 3
    people_affected: Optional[int] = 1
    reported_by: Optional[str] = None
    reported_for: Optional[str] = None     # CR filing on behalf
    actor_id: Optional[str] = None
    actor_role: Optional[str] = "STUDENT"


class EventRequest(BaseModel):
    to_status: str                         # Target status in state machine
    note: Optional[str] = None
    photo_url: Optional[str] = None
    assignee_id: Optional[str] = None      # Required on ASSIGNED / REASSIGNED
    severity: Optional[int] = None
    reason: Optional[str] = None           # Required on REJECTED / REJECTED_BACK
    actor_id: Optional[str] = None
    actor_role: Optional[str] = "STUDENT"


class ComplaintResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    ticket_no: str
    title: str
    description: str
    category_code: str
    hostel_id: Optional[str] = None
    hostel_code: Optional[str] = None
    block_name: Optional[str] = None
    room_no: Optional[str] = None
    location_text: Optional[str] = None
    status: str
    priority: str
    severity: int
    risk_score: Optional[float] = None
    risk_explanation: Optional[str] = None
    ranking_score: Optional[float] = None
    queue_rank: Optional[int] = None
    duplicate_of: Optional[str] = None
    ai_category_confidence: Optional[float] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_at: Optional[datetime] = None
    sla_deadline: Optional[datetime] = None
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    resolution_photo_url: Optional[str] = None
    people_affected: int
    upvote_count: int
    reported_by: Optional[str] = None
    created_at: datetime


class TimelineEventResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    complaint_id: str
    from_status: Optional[str] = None
    to_status: str
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None
    note: Optional[str] = None
    photo_url: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    created_at: datetime
