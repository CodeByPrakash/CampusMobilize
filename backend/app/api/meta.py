"""
Reference & Metadata Endpoints (7.2, 2.2, 15)
Provides hostels, rooms, categories, SLA policies, and 1-click demo personas.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Hostel, Block, Room, Category, SlaPolicy, User, CaretakerSkill

router = APIRouter(prefix="/meta", tags=["Metadata"])

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "STUDENT": ["file_complaint", "view_own_hostel"],
    "CR": ["file_complaint", "file_on_behalf", "view_own_hostel"],
    "HOSTEL_REP": ["file_complaint", "view_own_hostel", "verify_reject", "merge_duplicates", "override_severity"],
    "CARETAKER": ["view_own_hostel", "move_kanban"],
    "WARDEN": ["view_own_hostel", "verify_reject", "merge_duplicates", "override_severity", "assign_reassign", "approve_closure", "reward_approval", "export_reports"],
    "CHIEF_WARDEN": ["cross_hostel_view", "festival_prebrief", "utility_bill_upload", "approve_closure", "reward_approval", "export_reports", "assign_reassign"],
    "ESTATE_OFFICER": ["cross_hostel_view", "festival_prebrief", "utility_bill_upload"],
    "DIRECTOR": ["cross_hostel_view", "festival_prebrief_read", "export_reports", "read_only_decision"],
    "ADMIN": ["user_management", "sla_policies", "export_reports", "full_admin"]
}


@router.get("/hostels")
def get_hostels(db: Session = Depends(get_db)):
    """Returns list of hostels with nested blocks and rooms for UI pickers."""
    hostels = db.query(Hostel).all()
    result = []
    for h in hostels:
        blocks_data = []
        for b in h.blocks:
            rooms_data = [{"id": r.id, "room_no": r.room_no} for r in b.rooms]
            blocks_data.append({
                "id": b.id,
                "name": b.name,
                "kind": b.kind,
                "rooms": rooms_data
            })
        result.append({
            "id": h.id,
            "code": h.code,
            "name": h.name,
            "type": h.type,
            "resident_count": h.resident_count,
            "blocks": blocks_data
        })
    return result


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Returns complaint categories with default severity and SLA class."""
    categories = db.query(Category).all()
    return [
        {
            "code": c.code,
            "name": c.name,
            "default_severity": c.default_severity,
            "sla_class": c.sla_class
        }
        for c in categories
    ]


@router.get("/sla-policies")
def get_sla_policies(db: Session = Depends(get_db)):
    """Returns SLA policies table (P1 to P4)."""
    policies = db.query(SlaPolicy).all()
    return [
        {
            "priority": p.priority,
            "sla_hours": p.sla_hours,
            "warning_at_pct": p.warning_at_pct,
            "p1_escalation_minutes": p.p1_escalation_minutes
        }
        for p in policies
    ]


@router.get("/personas")
def get_personas(db: Session = Depends(get_db)):
    """
    Returns the canonical demonstration personas for 1-click frontend switching.
    Includes role permissions array and hostel details.
    """
    users = db.query(User).filter(User.is_active == True).all()
    result = []
    for u in users:
        hostel = db.query(Hostel).filter(Hostel.id == u.hostel_id).first() if u.hostel_id else None
        
        # Skills if caretaker
        skills = []
        if u.role == "CARETAKER":
            c_skills = db.query(CaretakerSkill).filter(CaretakerSkill.user_id == u.id).all()
            skills = [{"skill": s.skill, "proficiency": s.proficiency} for s in c_skills]

        perms = ROLE_PERMISSIONS.get(u.role, ["view_own_hostel"])
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "role": u.role,
            "hostel_id": u.hostel_id,
            "hostel_code": hostel.code if hostel else None,
            "hostel_name": hostel.name if hostel else None,
            "skills": skills,
            "permissions": perms
        })
    return result


@router.get("/personas/{role_or_id}")
def get_persona(role_or_id: str, db: Session = Depends(get_db)):
    """Look up a specific persona by role or user id."""
    query = role_or_id.upper()
    user = db.query(User).filter((User.id == role_or_id) | (User.role == query)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Persona not found")

    hostel = db.query(Hostel).filter(Hostel.id == user.hostel_id).first() if user.hostel_id else None
    perms = ROLE_PERMISSIONS.get(user.role, ["view_own_hostel"])

    skills = []
    if user.role == "CARETAKER":
        c_skills = db.query(CaretakerSkill).filter(CaretakerSkill.user_id == user.id).all()
        skills = [{"skill": s.skill, "proficiency": s.proficiency} for s in c_skills]

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "hostel_id": user.hostel_id,
        "hostel_code": hostel.code if hostel else None,
        "permissions": perms,
        "skills": skills
    }


class TestMailRequest(BaseModel):
    to_email: str = "delivered@resend.dev"
    subject: str = "CampusIQ Resend Integration Test"
    message: str = "This is a live test email sent via Resend from CampusIQ Backend (NIT Rourkela)."


@router.post("/test-mail")
def test_send_mail(payload: TestMailRequest, db: Session = Depends(get_db)):
    """Allows testing Resend email integration directly from Postman or UI."""
    from ..services.mail_service import MailService
    log = MailService.send_custom_email(
        db=db,
        to_emails=[payload.to_email],
        subject=payload.subject,
        message=payload.message,
        template="test_mail"
    )
    return {
        "status": log.status,
        "email_log_id": log.id,
        "to": log.to_emails,
        "subject": log.subject,
        "sent_at": log.sent_at.isoformat() if log.sent_at else None,
        "message": "Email logged and dispatched via Resend if RESEND_API_KEY is configured."
    }

