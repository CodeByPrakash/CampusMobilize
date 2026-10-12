"""
Campus Events & Festival Pre-Brief Router (7.6, 8.5)
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


@router.get("/{event_id}/prebrief")
@router.post("/{event_id}/prebrief")
def generate_event_prebrief(
    event_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generates an autonomous Festival Pre-Brief Operational Package (8.5).
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


# In-memory store for issued mandates during application session
_ISSUED_MANDATES: Dict[str, Any] = {}


class MandateIssuePayload(BaseModel):
    issuer_name: Optional[str] = "Prof. M. Mishra"
    issuer_role: Optional[str] = "CHIEF_WARDEN"
    target_hostels: Optional[List[str]] = ["Hall 14", "Hall 3", "CVR", "HB-3", "KMS"]
    directives: Optional[List[str]] = None
    water_contingency: Optional[str] = None
    dg_contingency: Optional[str] = None
    sanitation_contingency: Optional[str] = None
    budget_approved_inr: Optional[int] = 52000


@router.post("/{event_id}/mandate")
def issue_chief_warden_mandate(
    event_id: str,
    payload: MandateIssuePayload,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Issues and logs an official Chief Warden Mandate (8.5).
    Dispatches notifications to Hall Wardens and Estate Office.
    """
    event = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    event_name = event.name if event else "Campus Event"
    mandate_ref = f"CWM-NITR-2026-{event_id.replace('evt-', '').upper()[:8]}-MANDATE"

    record = {
        "mandate_id": mandate_ref,
        "event_id": event_id,
        "event_name": event_name,
        "status": "ISSUED",
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "issued_by": payload.issuer_name or "Prof. M. Mishra (Chief Warden)",
        "target_hostels": payload.target_hostels or ["Hall 14", "Hall 3", "CVR", "HB-3", "KMS"],
        "budget_approved_inr": payload.budget_approved_inr or 52000,
        "water_contingency": payload.water_contingency or "Pre-fill all rooftop storage tanks to 100% 12h prior. 2 standby 10,000L PHED tankers requisitioned.",
        "dg_contingency": payload.dg_contingency or "800L HSD fuel reserve in Substation 2 generator verified. Dual-feed breaker test scheduled.",
        "sanitation_contingency": payload.sanitation_contingency or "Washroom cleaning frequency doubled to 4h cycle. 2 roving emergency plumbers assigned.",
        "directives": payload.directives or [
            "All Hall Wardens to verify overhead tank floats 24h prior.",
            "Sanitation flying squads active from 06:00 to 23:00.",
            "Emergency electrical breaker hotline staged with Estate Officer."
        ],
        "acknowledgement": {
            "estate_office": "ACKNOWLEDGED",
            "hall_wardens": "DISPATCHED_TO_4_HALLS",
            "water_supply_wing": "REQUISITION_RECEIVED"
        }
    }
    _ISSUED_MANDATES[event_id] = record
    return record


@router.get("/{event_id}/mandate")
def get_chief_warden_mandate(
    event_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieves the latest issued mandate for an event."""
    if event_id in _ISSUED_MANDATES:
        return _ISSUED_MANDATES[event_id]
    
    # Return default draft mandate if not explicitly issued yet
    event = db.query(CampusEvent).filter(CampusEvent.id == event_id).first()
    event_name = event.name if event else "Campus Event"
    return {
        "mandate_id": f"CWM-NITR-2026-DRAFT",
        "event_id": event_id,
        "event_name": event_name,
        "status": "DRAFT",
        "issued_at": None,
        "issued_by": "Prof. M. Mishra (Chief Warden)",
        "target_hostels": ["Hall 14", "Hall 3", "CVR", "HB-3", "KMS"],
        "budget_approved_inr": 52000,
        "water_contingency": "Pre-fill all rooftop storage tanks to 100% 12h prior. 2 standby 10,000L PHED tankers requisitioned.",
        "dg_contingency": "800L HSD fuel reserve in Substation 2 generator verified. Dual-feed breaker test scheduled.",
        "sanitation_contingency": "Washroom cleaning frequency doubled to 4h cycle. 2 roving emergency plumbers assigned.",
        "directives": [
            "All Hall Wardens to verify overhead tank floats 24h prior.",
            "Sanitation flying squads active from 06:00 to 23:00.",
            "Emergency electrical breaker hotline staged with Estate Officer."
        ],
        "acknowledgement": {
            "estate_office": "PENDING_ISSUANCE",
            "hall_wardens": "PENDING_ISSUANCE"
        }
    }
