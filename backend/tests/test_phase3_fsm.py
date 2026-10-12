"""
Phase 3 Test Suite: Complaint Lifecycle FSM & Timeline Engine (3, 7.3, 7.4)
Tests intake with AI triage, P1 bypass, duplicate auto-merge, FSM transition matrix,
role constraints, audit timeline, and scope isolation.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal, init_db
from backend.app.seed import seed_database
from backend.app.models import Complaint, ComplaintEvent, Hostel, User


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure database is initialized and seeded before tests run."""
    init_db()
    with SessionLocal() as session:
        if session.query(Hostel).count() == 0:
            seed_database(session)
        session.query(ComplaintEvent).delete()
        session.query(Complaint).delete()
        session.commit()
    yield
    with SessionLocal() as session:
        session.query(ComplaintEvent).delete()
        session.query(Complaint).delete()
        session.commit()


@pytest.fixture
def client():
    return TestClient(app)


def test_complaint_intake_p3_standard_flow(client):
    """
    Test standard P3 complaint filing:
    - AI infers category if AUTO
    - Ticket format: CIQ-<year>-#####
    - Starts in OPEN status
    - Initial event recorded in timeline
    """
    payload = {
        "title": "Ceiling fan regulator broken",
        "description": "The fan regulator knob is completely broken and stuck at maximum speed in room 204.",
        "category_code": "AUTO",
        "hostel_code": "HB-3",
        "block_name": "B Block",
        "location_text": "Room 204, B Block",
        "severity": 2,
        "people_affected": 2,
        "reported_by": "usr-student-aarav",
        "actor_role": "STUDENT"
    }

    res = client.post("/api/v1/complaints", json=payload)
    assert res.status_code == 201
    data = res.json()

    assert data["ticket_no"].startswith("CIQ-")
    assert data["category_code"] == "ELECTRICAL"
    assert data["status"] == "OPEN"
    assert data["priority"] in ["P2", "P3", "P4"]
    assert data["upvote_count"] == 0

    # Verify timeline event
    t_res = client.get(f"/api/v1/complaints/{data['ticket_no']}/timeline")
    assert t_res.status_code == 200
    timeline = t_res.json()
    assert len(timeline) == 1
    assert timeline[0]["to_status"] == "OPEN"
    assert timeline[0]["actor_role"] == "STUDENT"


def test_p1_auto_assignment_bypasses_verify(client):
    """
    Test high-risk P1 complaint:
    - High risk triggers immediate ASSIGNED status, bypassing VERIFIED (3 Rule 1).
    - Sets SLA deadline to 2 hours.
    - Automatically matches a qualified caretaker.
    - Timeline has 2 events (OPEN, then ASSIGNED by AUTO_ENGINE).
    """
    payload = {
        "title": "Sparking exposed 440V wire near bathroom",
        "description": "Naked wire sparking heavily with smoke and burning smell in first floor corridor near washroom.",
        "category_code": "ELECTRICAL",
        "hostel_code": "HB-3",
        "block_name": "A Block",
        "location_text": "1st Floor corridor washroom",
        "severity": 5,
        "people_affected": 20,
        "reported_by": "usr-student-aarav",
        "actor_role": "STUDENT"
    }

    res = client.post("/api/v1/complaints", json=payload)
    assert res.status_code == 201
    data = res.json()

    assert data["priority"] == "P1"
    assert data["status"] == "ASSIGNED"
    assert data["risk_score"] >= 80.0
    assert data["sla_deadline"] is not None

    # Check timeline for 2 sequential events
    t_res = client.get(f"/api/v1/complaints/{data['id']}/timeline")
    assert t_res.status_code == 200
    timeline = t_res.json()
    assert len(timeline) == 2
    assert timeline[0]["to_status"] == "OPEN"
    assert timeline[1]["to_status"] == "ASSIGNED"
    assert timeline[1]["actor_role"] == "AUTO_ENGINE"


def test_duplicate_detection_links_parent_and_upvotes(client):
    """
    Test duplicate detection:
    - Second complaint on same issue links to first parent.
    - First parent's upvote_count increases.
    """
    c1_payload = {
        "title": "Water overflowing from overhead tank in A Block",
        "description": "Major water overflow from rooftop tank in A Block corridor leaking down stairs.",
        "category_code": "WATER",
        "hostel_code": "HB-3",
        "block_name": "A Block",
        "location_text": "A Block rooftop tank",
        "severity": 3,
        "reported_by": "usr-student-aarav"
    }
    r1 = client.post("/api/v1/complaints", json=c1_payload)
    assert r1.status_code == 201
    parent = r1.json()
    initial_upvotes = parent["upvote_count"]

    c2_payload = {
        "title": "Water overflow from overhead tank in A Block",
        "description": "Rooftop water tank overflowing in A Block leaking heavily down stairs.",
        "category_code": "WATER",
        "hostel_code": "HB-3",
        "block_name": "A Block",
        "location_text": "A Block rooftop tank",
        "severity": 3,
        "reported_by": "usr-student-aarav"
    }
    r2 = client.post("/api/v1/complaints", json=c2_payload)
    assert r2.status_code == 201
    child = r2.json()

    assert child["duplicate_of"] == parent["id"]

    # Verify parent upvote incremented
    parent_refreshed = client.get(f"/api/v1/complaints/{parent['ticket_no']}").json()
    assert parent_refreshed["upvote_count"] == initial_upvotes + 1


def test_fsm_valid_full_lifecycle(client):
    """
    Test full happy path transition:
    OPEN -> VERIFIED (HOSTEL_REP) -> ASSIGNED (WARDEN) -> IN_PROGRESS (CARETAKER) -> RESOLVED (CARETAKER) -> CLOSED (WARDEN)
    """
    # 1. Create OPEN complaint
    r = client.post("/api/v1/complaints", json={
        "title": "Broken window latch in room 105",
        "description": "Window latch is loose and rattles during wind in room 105.",
        "category_code": "CIVIL",
        "hostel_code": "HB-3",
        "severity": 1,
        "reported_by": "usr-student-aarav"
    })
    ticket_id = r.json()["id"]

    # 2. OPEN -> VERIFIED (by Hostel Rep)
    v_res = client.post(f"/api/v1/complaints/{ticket_id}/events", json={
        "to_status": "VERIFIED",
        "actor_role": "HOSTEL_REP",
        "actor_id": "usr-rep-rohan",
        "note": "Verified in person at room 105"
    })
    assert v_res.status_code == 200
    assert v_res.json()["to_status"] == "VERIFIED"

    # 3. VERIFIED -> ASSIGNED (by Warden)
    a_res = client.post(f"/api/v1/complaints/{ticket_id}/events", json={
        "to_status": "ASSIGNED",
        "actor_role": "WARDEN",
        "actor_id": "usr-warden-nanda",
        "assignee_id": "usr-caretaker-das",
        "note": "Assigned to caretaker Das"
    })
    assert a_res.status_code == 200
    assert a_res.json()["to_status"] == "ASSIGNED"

    # 4. ASSIGNED -> IN_PROGRESS (by Caretaker)
    ip_res = client.post(f"/api/v1/complaints/{ticket_id}/events", json={
        "to_status": "IN_PROGRESS",
        "actor_role": "CARETAKER",
        "actor_id": "usr-caretaker-das",
        "note": "Procured screws, starting repair"
    })
    assert ip_res.status_code == 200
    assert ip_res.json()["to_status"] == "IN_PROGRESS"

    # 5. IN_PROGRESS -> RESOLVED (by Caretaker with mandatory photo and note)
    res_res = client.post(f"/api/v1/complaints/{ticket_id}/events", json={
        "to_status": "RESOLVED",
        "actor_role": "CARETAKER",
        "actor_id": "usr-caretaker-das",
        "note": "Fixed window latch and tightened screws",
        "photo_url": "https://campusiq.internal/uploads/repairs/win-105-fixed.jpg"
    })
    assert res_res.status_code == 200
    assert res_res.json()["to_status"] == "RESOLVED"

    # 6. RESOLVED -> CLOSED (by Warden)
    cl_res = client.post(f"/api/v1/complaints/{ticket_id}/events", json={
        "to_status": "CLOSED",
        "actor_role": "WARDEN",
        "actor_id": "usr-warden-nanda",
        "note": "Inspected resolution photo, approved closure"
    })
    assert cl_res.status_code == 200
    assert cl_res.json()["to_status"] == "CLOSED"

    # Check timeline length (1 OPEN + 5 transitions = 6)
    tl = client.get(f"/api/v1/complaints/{ticket_id}/timeline").json()
    assert len(tl) == 6
    statuses = [e["to_status"] for e in tl]
    assert statuses == ["OPEN", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]


def test_fsm_invalid_transition_returns_409(client):
    """Invalid state jump (OPEN -> RESOLVED) must return 409 INVALID_TRANSITION."""
    r = client.post("/api/v1/complaints", json={
        "title": "Loose door handle",
        "description": "Room 102 door handle is loose.",
        "category_code": "CIVIL",
        "hostel_code": "HB-3",
        "severity": 2
    })
    ticket_id = r.json()["id"]

    res = client.post(f"/api/v1/complaints/{ticket_id}/events", json={
        "to_status": "RESOLVED",
        "actor_role": "CARETAKER",
        "note": "Attempting illegal direct jump to RESOLVED"
    })
    assert res.status_code == 409
    assert "INVALID_TRANSITION" in res.json()["detail"]


def test_fsm_unauthorized_role_returns_403(client):
    """Unauthorized role attempting state transition must return 403 FORBIDDEN_ROLE."""
    r = client.post("/api/v1/complaints", json={
        "title": "Water cooler tap leaking",
        "description": "Water cooler 2nd floor tap leaking continuously.",
        "category_code": "WATER",
        "hostel_code": "HB-3",
        "severity": 2
    })
    ticket_id = r.json()["id"]

    # Student cannot verify complaints
    res = client.post(f"/api/v1/complaints/{ticket_id}/events", json={
        "to_status": "VERIFIED",
        "actor_role": "STUDENT",
        "note": "Student trying to verify"
    })
    assert res.status_code == 403
    assert "FORBIDDEN_ROLE" in res.json()["detail"]


def test_fsm_resolution_requires_note_or_photo(client):
    """Transitioning to RESOLVED requires note or photo; otherwise 422."""
    r = client.post("/api/v1/complaints", json={
        "title": "Study table leg shaky",
        "description": "Study table leg in room 209 is unsteady.",
        "category_code": "CIVIL",
        "hostel_code": "HB-3",
        "severity": 1
    })
    ticket_id = r.json()["id"]

    # Advance to IN_PROGRESS
    client.post(f"/api/v1/complaints/{ticket_id}/events", json={"to_status": "VERIFIED", "actor_role": "HOSTEL_REP"})
    client.post(f"/api/v1/complaints/{ticket_id}/events", json={"to_status": "ASSIGNED", "actor_role": "WARDEN", "assignee_id": "usr-caretaker-das"})
    client.post(f"/api/v1/complaints/{ticket_id}/events", json={"to_status": "IN_PROGRESS", "actor_role": "CARETAKER"})

    # Try RESOLVED without note or photo
    res = client.post(f"/api/v1/complaints/{ticket_id}/events", json={
        "to_status": "RESOLVED",
        "actor_role": "CARETAKER"
    })
    assert res.status_code == 422


def test_scope_isolation_returns_404_for_unauthorized_hostel(client):
    """
    Scope isolation (2.2):
    A student/rep in HB-3 attempting to view a complaint in KMS returns 404.
    A Chief Warden or Director can view across all hostels.
    """
    # Create KMS complaint
    kms_r = client.post("/api/v1/complaints", json={
        "title": "Geyser not heating in KMS 3rd floor",
        "description": "Geyser in KMS C-Block washroom not heating water.",
        "category_code": "ELECTRICAL",
        "hostel_code": "KMS",
        "severity": 3,
        "reported_by": "usr-student-aarav"
    })
    kms_ticket = kms_r.json()["ticket_no"]

    # Student from HB-3 attempts to access KMS ticket -> 404
    hb3_student_headers = {
        "X-Actor-Role": "STUDENT",
        "X-Hostel-Code": "HB-3"
    }
    get_res = client.get(f"/api/v1/complaints/{kms_ticket}", headers=hb3_student_headers)
    assert get_res.status_code == 404

    # Chief Warden attempts to access KMS ticket -> 200 OK
    cw_headers = {
        "X-Actor-Role": "CHIEF_WARDEN",
        "X-Hostel-Code": "HB-3"
    }
    cw_res = client.get(f"/api/v1/complaints/{kms_ticket}", headers=cw_headers)
    assert cw_res.status_code == 200
    assert cw_res.json()["ticket_no"] == kms_ticket


def test_complaint_upvoting(client):
    """Test community upvoting on active complaint."""
    r = client.post("/api/v1/complaints", json={
        "title": "Slow internet router in corridor",
        "description": "Wi-Fi access point in corridor dropping packets frequently.",
        "category_code": "MISC",
        "hostel_code": "HB-3",
        "severity": 2
    })
    ticket_no = r.json()["ticket_no"]

    up_res = client.post(f"/api/v1/complaints/{ticket_no}/upvote")
    assert up_res.status_code == 200
    assert up_res.json()["upvote_count"] == 1
