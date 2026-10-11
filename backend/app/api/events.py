"""
Campus Events & Festival Pre-Brief Router (§7.6, §8.5)
Manages event calendar and generates autonomous pre-brief operational packages.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import CampusEvent, Hostel, UtilityBill
from ..ai.prebrief import PreBriefGenerator

router = APIRouter(prefix="/events", tags=["Events & Festival Pre-Briefs"])

prebrief_generator = PreBriefGenerator()


class EventCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    kind: str = Field(..., description="festival|techfest|exam|convocation")
    starts_on: str = Field(..., description="YYYY-MM-DD")
    ends_on: str = Field(..., description="YYYY-MM-DD")
    expected_footfall: Optional[int] = 1000
    water_surge_multiplier: Optional[float] = 1.25
    electricity_surge_multiplier: Optional[float] = 1.20
    hygiene_pressure_multiplier: Optional[float] = 2.0


@router.post("", status_code=201)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Creates a new campus festival or major academic event."""
    ev = CampusEvent(
        name=payload.name,
        kind=payload.kind,
        starts_on=date.fromisoformat(payload.starts_on),
        ends_on=date.fromisoformat(payload.ends_on),
        expected_footfall=payload.expected_footfall or 1000,
        water_surge_multiplier=payload.water_surge_multiplier or 1.25,
        electricity_surge_multiplier=payload.electricity_surge_multiplier or 1.20,
        hygiene_pressure_multiplier=payload.hygiene_pressure_multiplier or 2.0,
        created_at=datetime.now(timezone.utc)
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return {
        "id": ev.id,
        "name": ev.name,
        "kind": ev.kind,
        "starts_on": ev.starts_on.isoformat(),
        "ends_on": ev.ends_on.isoformat(),
        "expected_footfall": ev.expected_footfall,
        "water_surge_multiplier": ev.water_surge_multiplier,
        "electricity_surge_multiplier": ev.electricity_surge_multiplier
    }


@router.get("")
def list_events(
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Lists all registered campus events."""
    events = db.query(CampusEvent).order_by(CampusEvent.starts_on.asc()).all()
    return [
        {
            "id": ev.id,
            "name": ev.name,
            "kind": ev.kind,
            "starts_on": ev.starts_on.isoformat(),
            "ends_on": ev.ends_on.isoformat(),
            "expected_footfall": ev.expected_footfall,
            "water_surge_multiplier": ev.water_surge_multiplier,
            "electricity_surge_multiplier": ev.electricity_surge_multiplier,
            "hygiene_pressure_multiplier": ev.hygiene_pressure_multiplier
        }
        for ev in events
    ]


@router.get("/upcoming")
def get_upcoming_events(
    days: int = Query(90, ge=1, le=365),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Retrieves events occurring within the next N days."""
    today = date.today()
    cutoff = today + timedelta(days=days)

    events = db.query(CampusEvent).filter(
        CampusEvent.ends_on >= today,
        CampusEvent.starts_on <= cutoff
    ).order_by(CampusEvent.starts_on.asc()).all()

    return [
        {
            "id": ev.id,
            "name": ev.name,
            "kind": ev.kind,
            "starts_on": ev.starts_on.isoformat(),
            "ends_on": ev.ends_on.isoformat(),
            "expected_footfall": ev.expected_footfall,
            "water_surge_multiplier": ev.water_surge_multiplier,
            "electricity_surge_multiplier": ev.electricity_surge_multiplier
        }
        for ev in events
    ]


@router.post("/{event_id}/prebrief")
def generate_event_prebrief(
    event_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generates an autonomous Festival Pre-Brief Operational Package (§8.5).
    Includes surge multipliers, budget impact, staff redeployment, and checklists.
    """
    event = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    prebrief = prebrief_generator.generate_prebrief(
        event={
            "id": event.id,
            "name": event.name,
            "kind": event.kind,
            "starts_on": event.starts_on.isoformat(),
            "ends_on": event.ends_on.isoformat(),
            "expected_footfall": event.expected_footfall,
            "water_surge_multiplier": event.water_surge_multiplier,
            "electricity_surge_multiplier": event.electricity_surge_multiplier,
            "hygiene_pressure_multiplier": event.hygiene_pressure_multiplier
        }
    )
    prebrief["estimated_budget_inr"] = prebrief.get("budget_inr", 52000)
    prebrief["contingency_checklist"] = prebrief.get("recommendations", [])
    prebrief["staffing_plan"] = {
        "extra_sanitation_workers": 4,
        "on_call_electricians": 2,
        "pump_operators": 2
    }
    return prebrief
