"""
Phase 4 Test Suite: SLA Engine, Workers & Offline Email System (§7.4, §9, §10)
Tests 75% warning trigger, 100% breach auto-escalation (+10 risk penalty),
P1 45-minute inactivity escalation, and offline email audit logging.
"""

import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database import SessionLocal, init_db
from backend.app.seed import seed_database
from backend.app.models import Complaint, ComplaintEvent, EmailLog, Hostel, User
from backend.app.workers.sla_worker import SlaWorker


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure database is seeded and complaints cleared for test isolation."""
    init_db()
    with SessionLocal() as session:
        if session.query(Hostel).count() == 0:
            seed_database(session)
        session.query(EmailLog).delete()
        session.query(ComplaintEvent).delete()
        session.query(Complaint).delete()
        session.commit()
    yield
    with SessionLocal() as session:
        session.query(EmailLog).delete()
        session.query(ComplaintEvent).delete()
        session.query(Complaint).delete()
        session.commit()


@pytest.fixture
def client():
    return TestClient(app)


def test_sla_warning_threshold_at_75_percent(client):
    """
    Test 75% SLA threshold warning:
    - Ticket assigned with 8-hour window.
    - Simulated time at 6.5 hours (81% elapsed).
    - SLA tick triggers warning email to assignee with official signature.
    """
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        hostel = db.query(Hostel).filter(Hostel.code == "HB-3").first()
        complaint = Complaint(
            ticket_no="CIQ-2026-90001",
            title="Fluorescent tube flickering",
            description="Tube light flickering in common study room HB-3.",
            category_code="ELECTRICAL",
            hostel_id=hostel.id,
            status="ASSIGNED",
            priority="P2",
            severity=3,
            risk_score=50.0,
            assigned_to="usr-caretaker-das",
            assigned_at=now - timedelta(hours=6.5),
            sla_deadline=now + timedelta(hours=1.5),  # 8h window total, 6.5h elapsed = 81%
            people_affected=5,
            created_at=now - timedelta(hours=6.5)
        )
        db.add(complaint)
        db.commit()

    # Trigger SLA check
    tick_res = client.post("/api/v1/sla/tick")
    assert tick_res.status_code == 200
    report = tick_res.json()
    assert report["warned_count"] >= 1

    # Verify email log generated
    log_res = client.get("/api/v1/notifications/email-logs?template=sla_warning")
    assert log_res.status_code == 200
    logs = log_res.json()
    assert len(logs) >= 1
    assert "CIQ-2026-90001" in logs[0]["subject"]
    assert "Estate Office, NIT Rourkela" in logs[0]["body"]


def test_sla_breach_auto_escalation_at_100_percent(client):
    """
    Test 100% SLA deadline breach:
    - Ticket deadline has expired.
    - Auto-transitions status to ESCALATED.
    - Adds +10 risk penalty score.
    - Records SLA_WORKER event in complaint_events timeline.
    - Logs escalation email to Chief Warden.
    """
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        hostel = db.query(Hostel).filter(Hostel.code == "HB-3").first()
        complaint = Complaint(
            ticket_no="CIQ-2026-90002",
            title="Main water pipeline leak in B-Block",
            description="Continuous water spillage near basement B-Block.",
            category_code="WATER",
            hostel_id=hostel.id,
            status="IN_PROGRESS",
            priority="P2",
            severity=3,
            risk_score=55.0,
            assigned_to="usr-caretaker-das",
            assigned_at=now - timedelta(hours=10),
            sla_deadline=now - timedelta(hours=2),  # Expired 2 hours ago
            people_affected=25,
            created_at=now - timedelta(hours=10)
        )
        db.add(complaint)
        db.commit()

    # Run SLA worker tick
    tick_res = client.post("/api/v1/sla/tick")
    assert tick_res.status_code == 200
    report = tick_res.json()
    assert report["escalated_count"] >= 1

    # Verify complaint state updated
    c_res = client.get("/api/v1/complaints/CIQ-2026-90002")
    assert c_res.status_code == 200
    data = c_res.json()
    assert data["status"] == "ESCALATED"
    assert data["risk_score"] == 65.0  # 55.0 + 10.0 penalty

    # Verify immutable event timeline
    tl_res = client.get("/api/v1/complaints/CIQ-2026-90002/timeline")
    assert tl_res.status_code == 200
    events = tl_res.json()
    escalated_event = [e for e in events if e["to_status"] == "ESCALATED"]
    assert len(escalated_event) == 1
    assert escalated_event[0]["actor_role"] == "SLA_WORKER"

    # Verify email dispatched to Chief Warden
    email_res = client.get("/api/v1/notifications/email-logs?template=escalated")
    assert email_res.status_code == 200
    assert len(email_res.json()) >= 1
    assert "chief.warden@campusiq.in" in email_res.json()[0]["to_emails"]


def test_p1_inactivity_escalation_after_45_mins(client):
    """
    Test P1 45-minute inactivity escalation:
    - P1 ticket lodged 50 minutes ago in ASSIGNED status without progress.
    - Triggers immediate auto-escalation to Chief Warden.
    """
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        hostel = db.query(Hostel).filter(Hostel.code == "HB-3").first()
        complaint = Complaint(
            ticket_no="CIQ-2026-90003",
            title="Electrical fire near server room",
            description="Smoke billowing from switchboard near server rack.",
            category_code="ELECTRICAL",
            hostel_id=hostel.id,
            status="ASSIGNED",
            priority="P1",
            severity=5,
            risk_score=85.0,
            assigned_to="usr-caretaker-das",
            assigned_at=now - timedelta(minutes=50),
            sla_deadline=now + timedelta(minutes=70),
            people_affected=100,
            created_at=now - timedelta(minutes=50)  # 50 mins idle
        )
        db.add(complaint)
        db.commit()

    tick_res = client.post("/api/v1/sla/tick")
    assert tick_res.status_code == 200
    report = tick_res.json()
    assert report["p1_alerts_count"] >= 1

    # Verify status changed to ESCALATED
    c_res = client.get("/api/v1/complaints/CIQ-2026-90003")
    assert c_res.json()["status"] == "ESCALATED"
    assert c_res.json()["risk_score"] == 95.0  # 85.0 + 10.0 penalty


def test_sla_tick_idempotence(client):
    """
    Multiple consecutive ticks must not re-escalate already escalated tickets
    or compound risk penalties repeatedly.
    """
    res1 = client.post("/api/v1/sla/tick")
    res2 = client.post("/api/v1/sla/tick")
    assert res1.status_code == 200
    assert res2.status_code == 200

    # Risk score of CIQ-2026-90002 should stay stable at 65.0
    c_res = client.get("/api/v1/complaints/CIQ-2026-90002")
    assert c_res.json()["risk_score"] == 65.0
