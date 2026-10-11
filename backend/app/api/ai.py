"""
AI & Facility Intelligence REST Endpoints (§7.5, §7.6, §8)
Exposes complaint triage, dynamic queue ranking, utility forecasts, and continuous learning.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..ai.engine import CampusAIEngine
from ..models import Complaint, User, Hostel

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

# Shared engine instance
ai_engine = CampusAIEngine()


@router.post("/triage")
def triage_complaint(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Runs full autonomous triage on a complaint draft:
    Classifies category, checks duplicates, scores risk, calculates ranking, matches caretaker.
    """
    hostel_code = payload.get("hostel_code", "HB-3")
    
    # Fetch active complaints in same hostel for duplicate detection
    hostel = db.query(Hostel).filter(Hostel.code == hostel_code).first()
    active_complaints = []
    if hostel:
        db_complaints = db.query(Complaint).filter(
            Complaint.hostel_id == hostel.id,
            Complaint.status.in_(["OPEN", "VERIFIED", "ASSIGNED", "IN_PROGRESS"])
        ).all()
        for c in db_complaints:
            active_complaints.append({
                "id": c.id,
                "ticket_no": c.ticket_no,
                "title": c.title,
                "description": c.description,
                "location_text": c.location_text
            })

    # Fetch available caretakers
    caretakers = []
    db_caretakers = db.query(User).filter(User.role == "CARETAKER").all()
    for ct in db_caretakers:
        ct_hostel = db.query(Hostel).filter(Hostel.id == ct.hostel_id).first() if ct.hostel_id else None
        skills = {}
        for s in ct.caretaker_skills if hasattr(ct, "caretaker_skills") else []:
            skills[s.skill] = s.proficiency
        caretakers.append({
            "id": ct.id,
            "full_name": ct.full_name,
            "hostel_code": ct_hostel.code if ct_hostel else None,
            "skills": skills
        })

    triage_result = ai_engine.triage_complaint(
        complaint_data=payload,
        active_complaints=active_complaints,
        caretakers=caretakers
    )
    return triage_result


@router.get("/queue")
def get_ranked_queue(
    hostel_code: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns active tickets ranked dynamically by priority and SLA urgency."""
    query = db.query(Complaint).filter(
        Complaint.status.in_(["ASSIGNED", "IN_PROGRESS", "ESCALATED"])
    )
    if hostel_code:
        hostel = db.query(Hostel).filter(Hostel.code == hostel_code).first()
        if hostel:
            query = query.filter(Complaint.hostel_id == hostel.id)

    tickets = []
    for c in query.all():
        tickets.append({
            "id": c.id,
            "ticket_no": c.ticket_no,
            "title": c.title,
            "status": c.status,
            "priority": c.priority,
            "risk_score": c.risk_score or 50.0,
            "created_at": c.created_at,
            "assigned_at": c.assigned_at
        })

    ranked = ai_engine.rank_queue(tickets)
    return ranked


@router.get("/continuous-learning/status")
def get_learning_status():
    """Returns active continuous learning status, buffer counts, and drift alerts."""
    return ai_engine.get_learning_status()


@router.post("/continuous-learning/feedback")
def log_operator_feedback(
    payload: Dict[str, Any] = Body(...)
):
    """Logs verified supervisor category or severity correction."""
    ticket_no = payload.get("ticket_no", "UNKNOWN")
    title = payload.get("title", "")
    description = payload.get("description", "")
    category = payload.get("corrected_category", "MISC")
    severity = payload.get("corrected_severity")
    role = payload.get("actor_role", "WARDEN")

    res = ai_engine.ingest_operator_feedback(
        ticket_no=ticket_no,
        title=title,
        description=description,
        corrected_category=category,
        corrected_severity=severity,
        actor_role=role
    )
    return res


@router.post("/utilities/forecast")
def predict_utility_demand(
    payload: Dict[str, Any] = Body(...)
):
    """Predicts next utility consumption, rupee amounts with 90% CI and trend direction."""
    hostel = payload.get("hostel_code", "HB-3")
    utility = payload.get("utility", "electricity")
    month = int(payload.get("target_month", 11))
    residents = int(payload.get("resident_count", 850))
    tariff = float(payload.get("tariff_rate", 6.85 if utility == "electricity" else 18.50))
    event_mult = float(payload.get("event_multiplier", 1.0))

    pred = ai_engine.predict_next_bill(
        hostel_code=hostel,
        utility=utility,
        target_month=month,
        resident_count=residents,
        tariff_rate=tariff,
        event_multiplier=event_mult
    )
    return pred


@router.post("/utilities/bills/upload")
def upload_utility_bill(
    payload: Dict[str, Any] = Body(...)
):
    """
    Ingests utility bills uploaded from frontend, parses records,
    checks for drift/surge anomalies, and updates models continuously.
    """
    records = payload.get("bills", [])
    raw_csv = payload.get("csv_content")

    if raw_csv:
        parsed_records = ai_engine.parse_bill_file(raw_csv, is_csv=True)
        records.extend(parsed_records)

    if not records:
        raise HTTPException(status_code=400, detail="No bill records or CSV content provided")

    ingest_res = ai_engine.ingest_real_bills(records, auto_retrain=True)
    return {
        "status": "SUCCESS",
        "ingest_summary": ingest_res
    }
