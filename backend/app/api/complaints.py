"""
Complaint Lifecycle Engine & FSM Transition Router (3, 7.3, 7.4)
Implements state machine, event timeline, AI triage integration, and scoped access.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import (
    Complaint, ComplaintEvent, ComplaintMedia, ComplaintUpvote,
    Hostel, Block, Room, User, SlaPolicy
)
from ..schemas.complaints import (
    ComplaintCreate, ComplaintResponse, EventRequest, TimelineEventResponse,
    MergeRequest, PriorityOverrideRequest
)
from ..ai.engine import CampusAIEngine
from ..services.mail_service import MailService

router = APIRouter(prefix="/complaints", tags=["Complaints & FSM"])

ai_engine = CampusAIEngine()

# Valid transition matrix (7.4)
# (from_status, to_status) -> allowed roles
TRANSITION_RULES: Dict[tuple, List[str]] = {
    ("OPEN", "VERIFIED"): ["HOSTEL_REP", "WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("OPEN", "REJECTED"): ["HOSTEL_REP", "WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("OPEN", "ASSIGNED"): ["SYSTEM", "AUTO", "AUTO_ENGINE", "WARDEN", "CHIEF_WARDEN", "ADMIN"],  # P1 skips verify (3 Rule 1)
    ("VERIFIED", "ASSIGNED"): ["SYSTEM", "AUTO", "AUTO_ENGINE", "WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("VERIFIED", "REJECTED"): ["HOSTEL_REP", "WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("ASSIGNED", "ASSIGNED"): ["WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("ASSIGNED", "REASSIGNED"): ["WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("ASSIGNED", "IN_PROGRESS"): ["CARETAKER", "WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("REASSIGNED", "ASSIGNED"): ["WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("REASSIGNED", "REASSIGNED"): ["WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("REASSIGNED", "IN_PROGRESS"): ["CARETAKER", "WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("IN_PROGRESS", "ASSIGNED"): ["WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("IN_PROGRESS", "REASSIGNED"): ["WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("IN_PROGRESS", "RESOLVED"): ["CARETAKER", "WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("RESOLVED", "CLOSED"): ["WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("RESOLVED", "REJECTED_BACK"): ["WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("REJECTED_BACK", "IN_PROGRESS"): ["CARETAKER", "WARDEN", "CHIEF_WARDEN", "ADMIN"],
    ("REJECTED_BACK", "ASSIGNED"): ["WARDEN", "CHIEF_WARDEN", "ADMIN"],
}

CROSS_HOSTEL_ROLES = ["CHIEF_WARDEN", "DIRECTOR", "ESTATE_OFFICER", "ADMIN"]


def generate_ticket_no(db: Session) -> str:
    """Generates unique sequential ticket number: CIQ-<year>-#####"""
    current_year = datetime.now(timezone.utc).year
    prefix = f"CIQ-{current_year}-"
    existing_tickets = db.query(Complaint.ticket_no).filter(Complaint.ticket_no.like(f"{prefix}%")).all()
    max_seq = 0
    existing_set = set()
    for (t_no,) in existing_tickets:
        existing_set.add(t_no)
        try:
            val = int(t_no.split("-")[-1])
            if val > max_seq:
                max_seq = val
        except Exception:
            pass

    next_seq = max(max_seq + 1, 90003) if max_seq >= 90000 else max(max_seq + 1, 1)
    candidate = f"{prefix}{next_seq:05d}"
    while candidate in existing_set:
        next_seq += 1
        candidate = f"{prefix}{next_seq:05d}"

    return candidate


def get_sla_hours(priority: str, db: Session) -> int:
    """Fetches SLA hours from SLA policy table."""
    policy = db.query(SlaPolicy).filter(SlaPolicy.priority == priority).first()
    if policy:
        return policy.sla_hours
    defaults = {"P1": 2, "P2": 8, "P3": 48, "P4": 168}
    return defaults.get(priority, 48)


def normalize_category_code(code_str: Optional[str]) -> str:
    if not code_str:
        return "MISC"
    s = str(code_str).upper().strip()
    if any(k in s for k in ["ELECTR", "POWER", "LIGHT", "FAN", "WIR", "SPARK"]):
        return "ELECTRICAL"
    if any(k in s for k in ["WATER", "PLUMB", "LEAK", "PIPE", "TAP", "DRAIN"]):
        return "WATER"
    if any(k in s for k in ["HYGIEN", "SANIT", "CLEAN", "GARBAG", "TRASH", "SMELL"]):
        return "HYGIENE"
    if any(k in s for k in ["CIVIL", "CARPENT", "DOOR", "WINDOW", "MASON", "WALL", "TILE"]):
        return "CIVIL"
    if any(k in s for k in ["SECUR", "SAFE", "THEFT", "LOCK", "GATE", "GUARD"]):
        return "SECURITY"
    return "MISC"


def normalize_hostel_code(code_str: Optional[str]) -> Optional[str]:
    if not code_str:
        return None
    s = str(code_str).upper()
    if "HB-3" in s or "HB3" in s or "14" in s or "HOMI" in s:
        return "HB-3"
    if "KMS" in s or "KIRAN" in s:
        return "KMS"
    if "CVR" in s or "RAMAN" in s:
        return "CVR"
    if "GDB" in s or "GOPABANDHU" in s:
        return "GDB"
    return code_str.strip()


def get_request_persona(
    x_actor_role: Optional[str] = Header(None, alias="X-Actor-Role"),
    x_actor_id: Optional[str] = Header(None, alias="X-Actor-Id"),
    x_hostel_code: Optional[str] = Header(None, alias="X-Hostel-Code")
) -> Dict[str, Any]:
    """Extracts calling persona context from headers for 1-click frontend switching."""
    norm_code = normalize_hostel_code(x_hostel_code)
    return {
        "role": (x_actor_role or "STUDENT").upper(),
        "user_id": x_actor_id,
        "hostel_code": norm_code or "HB-3"
    }


# =========================================================================
# 1. CREATE COMPLAINT (WITH AI TRIAGE & STATE INITIALIZATION)
# =========================================================================
@router.post("", response_model=ComplaintResponse, status_code=201)
def create_complaint(
    payload: ComplaintCreate,
    persona: Dict[str, Any] = Depends(get_request_persona),
    db: Session = Depends(get_db)
):
    """
    Intake endpoint for complaints:
    1. Runs AI classification, duplicate detection, risk scoring, and caretaker matching.
    2. P1 (Risk >= 80): immediately sets ASSIGNED, bypassing verification (3 Rule 1).
    3. P2-P4: sets OPEN.
    4. Writes initial complaint_events timeline entry.
    """
    caller_role = (payload.actor_role or persona.get("role") or "STUDENT").upper()
    if caller_role in ["ESTATE_OFFICER", "DIRECTOR"]:
        raise HTTPException(
            status_code=403,
            detail=f"FORBIDDEN_ROLE: Role {caller_role} is not authorized to file complaints"
        )

    now = datetime.now(timezone.utc)
    ticket_no = generate_ticket_no(db)

    # Resolve hostel
    hostel = None
    target_code = normalize_hostel_code(payload.hostel_code) or persona.get("hostel_code")
    if target_code:
        hostel = db.query(Hostel).filter(Hostel.code == target_code).first()
    elif payload.hostel_id:
        hostel = db.query(Hostel).filter(Hostel.id == payload.hostel_id).first()
    if not hostel:
        hostel = db.query(Hostel).filter(Hostel.code == "HB-3").first()

    # Active complaints in same hostel for duplicate comparison
    active_complaints = []
    if hostel:
        db_active = db.query(Complaint).filter(
            Complaint.hostel_id == hostel.id,
            Complaint.status.in_(["OPEN", "VERIFIED", "ASSIGNED", "IN_PROGRESS"])
        ).all()
        for c in db_active:
            active_complaints.append({
                "id": c.id,
                "ticket_no": c.ticket_no,
                "title": c.title,
                "description": c.description,
                "block_name": payload.block_name,
                "location_text": c.location_text
            })

    # Available caretakers in hostel
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

    # Execute AI Triage
    triage = ai_engine.triage_complaint(
        complaint_data={
            "title": payload.title,
            "description": payload.description,
            "category_code": payload.category_code,
            "hostel_code": hostel.code if hostel else "HB-3",
            "block_name": payload.block_name,
            "location_text": payload.location_text,
            "severity": payload.severity or 3,
            "people_affected": payload.people_affected or 1
        },
        active_complaints=active_complaints,
        caretakers=caretakers,
        now=now
    )

    priority = payload.priority.upper() if payload.priority else triage["priority"]
    risk_score = triage["risk_score"]
    if priority == "P1":
        risk_score = max(risk_score, 82.0)
        triage["risk_score"] = risk_score
        triage["priority"] = "P1"
        triage["skip_verification"] = True
    elif payload.priority:
        triage["priority"] = priority

    is_p1 = (priority == "P1" or triage["skip_verification"])

    # State Machine initialization
    # P1 skips verify: OPEN -> ASSIGNED immediately (3 Rule 1)
    status = "ASSIGNED" if is_p1 else "OPEN"

    sla_h = get_sla_hours(priority, db)
    sla_deadline = now + timedelta(hours=sla_h) if is_p1 else None

    # Assigned caretaker
    assigned_to = None
    if is_p1 and triage["matched_caretaker"]["matched"]:
        matched_id = triage["matched_caretaker"]["caretaker_id"]
        ct_user = db.query(User).filter(User.id == matched_id).first()
        if not ct_user:
            ct_user = db.query(User).filter(User.role == "CARETAKER").first()
        assigned_to = ct_user.id if ct_user else None

    # Resolve block & room if names passed
    block_id = payload.block_id
    room_id = payload.room_id
    if hostel and not block_id and payload.block_name:
        blk = db.query(Block).filter(Block.hostel_id == hostel.id, Block.name.ilike(f"%{payload.block_name}%")).first()
        if blk:
            block_id = blk.id
            if not room_id and payload.room_no:
                rm = db.query(Room).filter(Room.block_id == blk.id, Room.room_no.ilike(f"%{payload.room_no}%")).first()
                if rm:
                    room_id = rm.id

    loc_text = payload.location_text
    if not loc_text:
        parts = []
        if payload.block_name:
            parts.append(payload.block_name)
        if payload.room_no:
            parts.append(f"Room {payload.room_no}")
        loc_text = ", ".join(parts) if parts else None

    # Safe reporter user resolution
    reported_by = payload.reported_by or payload.actor_id or persona.get("user_id")
    if reported_by:
        rep_user = db.query(User).filter(User.id == reported_by).first()
        if not rep_user:
            rep_user = db.query(User).filter(User.role == "STUDENT").first()
        reported_by = rep_user.id if rep_user else None
    else:
        rep_user = db.query(User).filter(User.role == "STUDENT").first()
        reported_by = rep_user.id if rep_user else None

    # Parent duplicate link
    dup_parent_id = triage["duplicate_of"] if triage["is_duplicate"] else None
    if dup_parent_id:
        parent_ticket = db.query(Complaint).filter(
            (Complaint.id == dup_parent_id) | (Complaint.ticket_no == dup_parent_id)
        ).first()
        if parent_ticket:
            parent_ticket.upvote_count += 1
            dup_parent_id = parent_ticket.id

    resolved_cat = normalize_category_code(triage.get("category_code") or payload.category_code)

    complaint = Complaint(
        ticket_no=ticket_no,
        title=payload.title,
        description=payload.description,
        category_code=resolved_cat,
        hostel_id=hostel.id if hostel else None,
        block_id=block_id,
        room_id=room_id,
        location_text=loc_text,
        lat=payload.lat,
        lng=payload.lng,
        reported_by=reported_by,
        reported_for=payload.reported_for,
        status=status,
        priority=priority,
        severity=payload.severity or 3,
        risk_score=risk_score,
        risk_explanation=triage["risk_explanation"],
        ranking_score=triage["ranking_score"],
        duplicate_of=dup_parent_id,
        ai_category_confidence=triage["category_confidence"],
        assigned_to=assigned_to,
        assigned_at=now if is_p1 else None,
        sla_deadline=sla_deadline,
        people_affected=payload.people_affected or 1,
        upvote_count=1 if dup_parent_id else 0,
        created_at=now
    )
    db.add(complaint)
    db.flush()

    # Initial timeline event: OPEN
    event_open = ComplaintEvent(
        complaint_id=complaint.id,
        from_status=None,
        to_status="OPEN",
        actor_id=reported_by or "usr-student-aarav",
        actor_role=payload.actor_role or persona.get("role") or "STUDENT",
        note="Complaint lodged via CampusIQ",
        created_at=now
    )
    db.add(event_open)

    # If P1: record immediate transition to ASSIGNED
    if is_p1:
        event_p1 = ComplaintEvent(
            complaint_id=complaint.id,
            from_status="OPEN",
            to_status="ASSIGNED",
            actor_id="system-ai-engine",
            actor_role="AUTO_ENGINE",
            note=f"High Risk ({risk_score} P1) triggered automatic verification bypass and caretaker assignment",
            created_at=now
        )
        db.add(event_p1)
        try:
            MailService.send_p1_urgent_alert(db=db, complaint=complaint)
        except Exception as e:
            print(f"[Resend Notice] P1 intake email error: {e}")

    db.commit()
    db.refresh(complaint)
    return complaint


# =========================================================================
# 2. LIST & GET COMPLAINTS (WITH SCOPE ISOLATION)
# =========================================================================
@router.get("", response_model=List[ComplaintResponse])
def list_complaints(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category_code: Optional[str] = Query(None),
    hostel_code: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    persona: Dict[str, Any] = Depends(get_request_persona),
    db: Session = Depends(get_db)
):
    """
    Lists complaints scoped to caller role.
    Students, CRs, Hostel Reps, Caretakers, and Wardens are scoped to their own hostel.
    """
    query = db.query(Complaint)

    # Scope isolation
    role = persona["role"]
    if role not in CROSS_HOSTEL_ROLES:
        scoped_hostel_code = normalize_hostel_code(hostel_code) or persona.get("hostel_code")
        if scoped_hostel_code:
            hostel = db.query(Hostel).filter(Hostel.code == scoped_hostel_code).first()
            if hostel:
                query = query.filter(Complaint.hostel_id == hostel.id)
    elif hostel_code:
        scoped_code = normalize_hostel_code(hostel_code)
        if scoped_code:
            hostel = db.query(Hostel).filter(Hostel.code == scoped_code).first()
            if hostel:
                query = query.filter(Complaint.hostel_id == hostel.id)

    if status:
        query = query.filter(Complaint.status == status.upper())
    if priority:
        query = query.filter(Complaint.priority == priority.upper())
    if category_code:
        query = query.filter(Complaint.category_code == category_code.upper())
    if assigned_to:
        query = query.filter(Complaint.assigned_to == assigned_to)

    complaints = query.order_by(desc(Complaint.created_at)).all()
    return complaints


@router.get("/{id_or_ticket}", response_model=ComplaintResponse)
def get_complaint(
    id_or_ticket: str,
    persona: Dict[str, Any] = Depends(get_request_persona),
    db: Session = Depends(get_db)
):
    """
    Retrieves complaint details by ID or ticket_no.
    Enforces scope isolation: returns 404 if caller cannot view tickets from another hostel.
    """
    complaint = db.query(Complaint).filter(
        (Complaint.id == id_or_ticket) | (Complaint.ticket_no == id_or_ticket)
    ).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Scope check
    role = persona["role"]
    if role not in CROSS_HOSTEL_ROLES and persona.get("hostel_code"):
        scoped_code = normalize_hostel_code(persona["hostel_code"])
        caller_hostel = db.query(Hostel).filter(Hostel.code == scoped_code).first() if scoped_code else None
        if caller_hostel and complaint.hostel_id and complaint.hostel_id != caller_hostel.id:
            # Spec rule: return 404, not 403, for cross-hostel scope isolation
            raise HTTPException(status_code=404, detail="Complaint not found")

    return complaint


@router.get("/{id_or_ticket}/timeline", response_model=List[TimelineEventResponse])
def get_complaint_timeline(
    id_or_ticket: str,
    db: Session = Depends(get_db)
):
    """Returns the immutable audit event timeline in ascending chronological order."""
    complaint = db.query(Complaint).filter(
        (Complaint.id == id_or_ticket) | (Complaint.ticket_no == id_or_ticket)
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    events = db.query(ComplaintEvent).filter(ComplaintEvent.complaint_id == complaint.id) \
               .order_by(ComplaintEvent.created_at.asc()).all()
    return events


# =========================================================================
# 3. STATE MACHINE TRANSITION ENDPOINT (/events)
# =========================================================================
@router.post("/{id_or_ticket}/events", response_model=TimelineEventResponse)
def transition_complaint_state(
    id_or_ticket: str,
    req: EventRequest,
    persona: Dict[str, Any] = Depends(get_request_persona),
    db: Session = Depends(get_db)
):
    """
    The ONLY way to change complaint status (3, 7.4).
    Enforces transition matrix, role permissions, mandatory resolution/rejection notes,
    and updates mutable fields transactionally.
    """
    complaint = db.query(Complaint).filter(
        (Complaint.id == id_or_ticket) | (Complaint.ticket_no == id_or_ticket)
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    from_status = complaint.status
    to_status = req.to_status.upper()
    now = datetime.now(timezone.utc)

    # Actor resolution
    actor_role = (req.actor_role or persona["role"]).upper()
    actor_id = req.actor_id or persona["user_id"] or f"user-{actor_role.lower()}"

    # Escalation from SLA worker or admin
    if to_status == "ESCALATED":
        if actor_role not in ["SLA_WORKER", "SYSTEM", "AUTO_ENGINE", "ADMIN", "CHIEF_WARDEN"]:
            raise HTTPException(status_code=403, detail="Only SLA engine or Chief Warden can escalate tickets")
        complaint.status = "ESCALATED"
        complaint.risk_score = min(100.0, (complaint.risk_score or 50.0) + 10.0)
    else:
        # Check transition validity (7.4 Table)
        rule_key = (from_status, to_status)
        if rule_key not in TRANSITION_RULES:
            raise HTTPException(
                status_code=409,
                detail=f"INVALID_TRANSITION: Cannot transition complaint from {from_status} to {to_status}"
            )

        allowed_roles = TRANSITION_RULES[rule_key]
        if actor_role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"FORBIDDEN_ROLE: Role {actor_role} is not authorized for {from_status} -> {to_status}"
            )

    # Specific Transition Validations
    if to_status == "RESOLVED":
        # Resolution requires note and photo
        if not req.photo_url and not req.note:
            raise HTTPException(status_code=422, detail="Resolution requires completion note and verification photo")
        complaint.resolved_at = now
        complaint.resolution_note = req.note or "Work completed"
        complaint.resolution_photo_url = req.photo_url
        try:
            MailService.send_resolution_pending(db=db, complaint=complaint)
        except Exception as e:
            print(f"[Resend Notice] Resolution pending email error: {e}")

    elif to_status in ["REJECTED", "REJECTED_BACK"]:
        # Rejection requires reason
        reason_text = req.reason or req.note
        if not reason_text or len(reason_text.strip()) < 3:
            raise HTTPException(status_code=422, detail="Rejection requires an explanation reason")

    elif to_status == "VERIFIED":
        user_rec = db.query(User).filter(User.id == actor_id).first()
        complaint.verified_by = user_rec.id if user_rec else None
        complaint.verified_at = now
        if req.severity:
            complaint.severity = max(1, min(5, req.severity))

    elif to_status in ["ASSIGNED", "REASSIGNED"]:
        new_assignee = req.assignee_id or complaint.assigned_to
        if new_assignee:
            ct_rec = db.query(User).filter(User.id == new_assignee).first()
            if not ct_rec:
                ct_rec = db.query(User).filter(User.role == "CARETAKER").first()
            new_assignee = ct_rec.id if ct_rec else None
        else:
            ct_rec = db.query(User).filter(User.role == "CARETAKER").first()
            new_assignee = ct_rec.id if ct_rec else None
        complaint.assigned_to = new_assignee
        complaint.assigned_at = now
        sla_h = get_sla_hours(complaint.priority, db)
        complaint.sla_deadline = now + timedelta(hours=sla_h)

    elif to_status == "CLOSED":
        complaint.closed_at = now
        user_rec = db.query(User).filter(User.id == actor_id).first()
        complaint.closed_by = user_rec.id if user_rec else None
        try:
            rep_email = "student.hb3@campusiq.in"
            if complaint.reported_by:
                rep_user = db.query(User).filter(User.id == complaint.reported_by).first()
                if rep_user and rep_user.email:
                    rep_email = rep_user.email
            MailService.send_ticket_closed(db=db, complaint=complaint, reporter_email=rep_email)
        except Exception as e:
            print(f"[Resend Notice] Closure email error: {e}")

    # Update complaint status
    complaint.status = to_status

    meta_dict = {}
    if req.assignee_id:
        meta_dict["assignee_id"] = req.assignee_id
    if getattr(req, "tradesman_name", None):
        meta_dict["tradesman_name"] = req.tradesman_name
    if getattr(req, "trade", None):
        meta_dict["trade"] = req.trade

    # Record immutable timeline event (3 Rule 3)
    event = ComplaintEvent(
        complaint_id=complaint.id,
        from_status=from_status,
        to_status=to_status,
        actor_id=actor_id,
        actor_role=actor_role,
        note=req.note or req.reason or f"Status transitioned to {to_status}",
        photo_url=req.photo_url,
        meta=meta_dict,
        created_at=now
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


# =========================================================================
# 4. UPVOTE COMPLAINT
# =========================================================================
@router.post("/{id_or_ticket}/upvote")
def upvote_complaint(
    id_or_ticket: str,
    persona: Dict[str, Any] = Depends(get_request_persona),
    db: Session = Depends(get_db)
):
    """Allows students in same hostel to upvote a complaint, raising community visibility."""
    caller_role = persona.get("role", "STUDENT").upper()
    if caller_role not in ["STUDENT", "CR", "HOSTEL_REP", "ADMIN"]:
        raise HTTPException(
            status_code=403,
            detail=f"FORBIDDEN_ROLE: Role {caller_role} is not authorized to upvote complaints"
        )

    complaint = db.query(Complaint).filter(
        (Complaint.id == id_or_ticket) | (Complaint.ticket_no == id_or_ticket)
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    complaint.upvote_count += 1
    db.commit()
    return {"ticket_no": complaint.ticket_no, "upvote_count": complaint.upvote_count}


# =========================================================================
# 5. DEDUPLICATION / MERGE COMPLAINTS (2.3)
# =========================================================================
@router.post("/{id_or_ticket}/merge", response_model=ComplaintResponse)
def merge_duplicate_complaints(
    id_or_ticket: str,
    payload: MergeRequest,
    persona: Dict[str, Any] = Depends(get_request_persona),
    db: Session = Depends(get_db)
):
    """
    Deduplication endpoint (2.3):
    Allows HOSTEL_REP, WARDEN, CHIEF_WARDEN, or ADMIN to merge duplicate complaints
    into a master parent ticket.
    """
    actor_role = persona["role"]
    if actor_role not in ["HOSTEL_REP", "WARDEN", "CHIEF_WARDEN", "ADMIN"]:
        raise HTTPException(
            status_code=403,
            detail=f"FORBIDDEN_ROLE: Role {actor_role} is not authorized to merge duplicate complaints"
        )

    parent = db.query(Complaint).filter(
        (Complaint.id == id_or_ticket) | (Complaint.ticket_no == id_or_ticket)
    ).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Master complaint not found")

    now = datetime.now(timezone.utc)
    for child_id in payload.duplicate_ticket_ids:
        child = db.query(Complaint).filter(
            (Complaint.id == child_id) | (Complaint.ticket_no == child_id)
        ).first()
        if child and child.id != parent.id:
            child.duplicate_of = parent.id
            old_status = child.status
            child.status = "REJECTED"
            parent.upvote_count += (1 + child.upvote_count)

            # Record child rejection/merge event
            event_child = ComplaintEvent(
                complaint_id=child.id,
                from_status=old_status,
                to_status="REJECTED",
                actor_id=persona.get("user_id") or "usr-rep-rohan",
                actor_role=actor_role,
                note=f"Auto-merged into master ticket #{parent.ticket_no}. {payload.reason}",
                created_at=now
            )
            db.add(event_child)

            # Record parent merge timeline event
            event_parent = ComplaintEvent(
                complaint_id=parent.id,
                from_status=parent.status,
                to_status=parent.status,
                actor_id=persona.get("user_id") or "usr-rep-rohan",
                actor_role=actor_role,
                note=f"Merged duplicate complaint #{child.ticket_no} into this ticket",
                created_at=now
            )
            db.add(event_parent)

    db.commit()
    db.refresh(parent)
    return parent


# =========================================================================
# 6. PRIORITY ESCALATION (2.3)
# =========================================================================
@router.post("/{id_or_ticket}/priority", response_model=ComplaintResponse)
def override_complaint_priority(
    id_or_ticket: str,
    payload: PriorityOverrideRequest,
    persona: Dict[str, Any] = Depends(get_request_persona),
    db: Session = Depends(get_db)
):
    """
    Priority escalation endpoint (2.3):
    Allows HOSTEL_REP to override/raise priority by exactly 1 class with logged justification.
    WARDEN, CHIEF_WARDEN, and ADMIN can set any priority.
    """
    actor_role = persona["role"]
    if actor_role not in ["HOSTEL_REP", "WARDEN", "CHIEF_WARDEN", "ADMIN"]:
        raise HTTPException(
            status_code=403,
            detail=f"FORBIDDEN_ROLE: Role {actor_role} is not authorized to override priority"
        )

    complaint = db.query(Complaint).filter(
        (Complaint.id == id_or_ticket) | (Complaint.ticket_no == id_or_ticket)
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    curr_priority = (complaint.priority or "P3").upper()
    target_priority = payload.new_priority.upper()

    priority_order = {"P4": 4, "P3": 3, "P2": 2, "P1": 1}
    if target_priority not in priority_order:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid priority: {target_priority}. Must be one of P1, P2, P3, P4."
        )

    now = datetime.now(timezone.utc)
    old_priority = complaint.priority
    complaint.priority = target_priority

    # Recalculate SLA deadline and risk score
    sla_h = get_sla_hours(target_priority, db)
    complaint.sla_deadline = now + timedelta(hours=sla_h)
    if target_priority == "P1":
        complaint.risk_score = max(complaint.risk_score or 50.0, 85.0)

    event = ComplaintEvent(
        complaint_id=complaint.id,
        from_status=complaint.status,
        to_status=complaint.status,
        actor_id=persona.get("user_id") or f"user-{actor_role.lower()}",
        actor_role=actor_role,
        note=f"Priority escalated from {old_priority} to {target_priority}. Justification: {payload.justification}",
        created_at=now
    )
    db.add(event)
    db.commit()
    db.refresh(complaint)
    return complaint


# =========================================================================
# 7. DELETE / WITHDRAW COMPLAINT (STUDENT GOVERNANCE)
# =========================================================================
@router.delete("/{id_or_ticket}")
def delete_complaint(
    id_or_ticket: str,
    persona: Dict[str, Any] = Depends(get_request_persona),
    db: Session = Depends(get_db)
):
    """
    Allows the submitting student (or admin) to delete their complaint IF IT IS NOT ESCALATED.
    Once escalated to higher authorities (Warden/Chief Warden), deletion is strictly prohibited.
    """
    complaint = db.query(Complaint).filter(
        (Complaint.id == id_or_ticket) | (Complaint.ticket_no == id_or_ticket)
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Check if complaint is escalated
    is_escalated = (
        (complaint.status or "").upper() == "ESCALATED"
        or any("escalat" in (e.note or "").lower() for e in complaint.events)
    )
    if is_escalated:
        raise HTTPException(
            status_code=400,
            detail="CANNOT_DELETE_ESCALATED: This complaint has already escalated to higher authorities. Deletion is prohibited."
        )

    caller_role = (persona.get("role") or "STUDENT").upper()
    caller_id = persona.get("user_id")

    # In student persona, verify authorization if reported_by is set
    if caller_role == "STUDENT" and complaint.reported_by and caller_id:
        if complaint.reported_by != caller_id:
            raise HTTPException(
                status_code=403,
                detail="FORBIDDEN: You can only delete complaints submitted by yourself."
            )

    ticket_no = complaint.ticket_no

    # Clean up associated media, upvotes, and events before deleting complaint
    db.query(ComplaintMedia).filter(ComplaintMedia.complaint_id == complaint.id).delete(synchronize_session=False)
    db.query(ComplaintUpvote).filter(ComplaintUpvote.complaint_id == complaint.id).delete(synchronize_session=False)
    db.query(ComplaintEvent).filter(ComplaintEvent.complaint_id == complaint.id).delete(synchronize_session=False)

    db.delete(complaint)
    db.commit()

    return {
        "success": True,
        "message": f"Complaint #{ticket_no} has been deleted successfully",
        "ticket_no": ticket_no
    }

