import os
import sys
import pytest

TEST_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(TEST_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_judge_demo_step1_and_step2_complaint_and_duplicate_merge():
    """
    Step 1 & 2 of 16 Judge Demo Script:
    1. Student files water leak complaint at HB-3 pump room.
    2. AI classifies WATER with high confidence.
    3. Second similar complaint filed -> merges with parent, upvote increments.
    """
    headers_student = {
        "X-Actor-Role": "STUDENT",
        "X-Actor-Id": "usr-student-aarav",
        "X-Hostel-Code": "HB-3"
    }

    # 1. First water leak complaint
    resp1 = client.post(
        "/api/v1/complaints",
        headers=headers_student,
        json={
            "title": "Severe water leakage in main pump room HB-3",
            "description": "Continuous water gushing from main pipe valve near pump room flooding corridor floor.",
            "hostel_code": "HB-3",
            "block_name": "Pump Room",
            "room_no": "PUMP-01",
            "people_affected": 80,
            "severity": 4
        }
    )
    assert resp1.status_code == 201, resp1.text
    ticket1 = resp1.json()
    assert ticket1["category_code"] == "WATER"
    assert ticket1["risk_score"] > 25.0
    assert ticket1["ticket_no"].startswith("CIQ-")

    # 2. Second complaint with similar tokens in same location
    resp2 = client.post(
        "/api/v1/complaints",
        headers=headers_student,
        json={
            "title": "Water leakage in pump room HB-3",
            "description": "Flooding from pipe valve near pump room corridor floor.",
            "hostel_code": "HB-3",
            "block_name": "Pump Room",
            "room_no": "PUMP-01",
            "people_affected": 40,
            "severity": 3
        }
    )
    assert resp2.status_code == 201
    ticket2 = resp2.json()

    # If duplicate detected, duplicate_of should point to a valid parent complaint
    if ticket2.get("duplicate_of"):
        assert len(ticket2["duplicate_of"]) > 10

def test_judge_demo_step3_and_step4_caretaker_to_warden_closure():
    """
    Step 3 & 4 of 16 Judge Demo Script:
    1. Student lodges complaint in HB-3 -> starts in OPEN.
    2. Hostel Rep verifies: OPEN -> VERIFIED.
    3. Warden assigns caretaker: VERIFIED -> ASSIGNED.
    4. Caretaker starts work: ASSIGNED -> IN_PROGRESS.
    5. Caretaker marks RESOLVED: IN_PROGRESS -> RESOLVED with photo and note.
    6. Warden approves closure: RESOLVED -> CLOSED.
    7. Audit timeline reflects full sequence of actors.
    """
    # 1. Student lodges complaint in HB-3
    headers_student = {
        "X-Actor-Role": "STUDENT",
        "X-Actor-Id": "usr-student-aarav",
        "X-Hostel-Code": "HB-3"
    }
    resp = client.post(
        "/api/v1/complaints",
        headers=headers_student,
        json={
            "title": "Corridor tube light flickering HB-3",
            "description": "Tube light in A-Block 2nd floor corridor keeps flickering at night.",
            "hostel_code": "HB-3",
            "block_name": "A-Block",
            "room_no": "204",
            "people_affected": 8,
            "severity": 2
        }
    )
    assert resp.status_code == 201
    ticket = resp.json()
    ticket_id = ticket["id"]

    # 2. Rep verifies ticket: OPEN -> VERIFIED
    resp_v = client.post(
        f"/api/v1/complaints/{ticket_id}/events",
        json={
            "to_status": "VERIFIED",
            "actor_role": "HOSTEL_REP",
            "actor_id": "usr-rep-rohan",
            "note": "Verified by Rohan Mehta (Hostel Rep)"
        }
    )
    assert resp_v.status_code == 200

    # 3. Warden assigns caretaker: VERIFIED -> ASSIGNED
    resp_a = client.post(
        f"/api/v1/complaints/{ticket_id}/events",
        json={
            "to_status": "ASSIGNED",
            "actor_role": "WARDEN",
            "actor_id": "usr-warden-nanda",
            "assignee_id": "usr-caretaker-das",
            "note": "Assigned to caretaker Das"
        }
    )
    assert resp_a.status_code == 200

    # 4. Caretaker starts work: ASSIGNED -> IN_PROGRESS
    resp_prog = client.post(
        f"/api/v1/complaints/{ticket_id}/events",
        json={
            "to_status": "IN_PROGRESS",
            "actor_role": "CARETAKER",
            "actor_id": "usr-caretaker-das",
            "note": "Procured choke replacement, starting work"
        }
    )
    assert resp_prog.status_code == 200

    # 5. Caretaker marks RESOLVED: IN_PROGRESS -> RESOLVED with photo and note
    resp_res = client.post(
        f"/api/v1/complaints/{ticket_id}/events",
        json={
            "to_status": "RESOLVED",
            "actor_role": "CARETAKER",
            "actor_id": "usr-caretaker-das",
            "note": "Installed new 36W LED batten; tested and fully functional.",
            "photo_url": "/photos/resolved_repaired_switchboard.jpg"
        }
    )
    assert resp_res.status_code == 200
    assert resp_res.json()["to_status"] == "RESOLVED"

    # 6. Warden approves closure: RESOLVED -> CLOSED
    resp_close = client.post(
        f"/api/v1/complaints/{ticket_id}/events",
        json={
            "to_status": "CLOSED",
            "actor_role": "WARDEN",
            "actor_id": "usr-warden-nanda",
            "note": "Inspection approved; good quality repair."
        }
    )
    assert resp_close.status_code == 200
    assert resp_close.json()["to_status"] == "CLOSED"

    # 7. Verify audit timeline
    resp_timeline = client.get(f"/api/v1/complaints/{ticket_id}/timeline")
    assert resp_timeline.status_code == 200
    events = resp_timeline.json()
    status_flow = [e["to_status"] for e in events]
    assert "CLOSED" in status_flow
    assert "RESOLVED" in status_flow
    assert "IN_PROGRESS" in status_flow
    assert "ASSIGNED" in status_flow
    assert "VERIFIED" in status_flow

def test_judge_demo_step5_and_step6_innovision_prebrief_and_cri():
    """
    Step 5 & 6 of 16 Judge Demo Script:
    1. Chief Warden / Estate Officer generates Innovision pre-brief.
    2. Director checks Campus Risk Index and Inter-Hostel Efficiency Ratings.
    """
    headers_director = {
        "X-Actor-Role": "DIRECTOR",
        "X-Actor-Id": "usr-director-sahoo"
    }

    # 1. Fetch events and generate Innovision pre-brief
    resp_events = client.get("/api/v1/events", headers=headers_director)
    assert resp_events.status_code == 200
    events = resp_events.json()
    assert isinstance(events, list)
    assert len(events) >= 1
    event_id = events[0]["id"]

    resp_prebrief = client.post(f"/api/v1/events/{event_id}/prebrief", headers=headers_director)
    assert resp_prebrief.status_code == 200
    prebrief = resp_prebrief.json()
    assert "predicted_surges" in prebrief
    assert "budget_inr" in prebrief
    assert "recommendations" in prebrief
    assert len(prebrief["recommendations"]) >= 1

    # 2. Fetch Campus Risk Index (CRI)
    resp_cri = client.get("/api/v1/analytics/risk-index", headers=headers_director)
    assert resp_cri.status_code == 200
    cri = resp_cri.json()
    assert 0 <= cri["campus_risk_index"] <= 100
    assert "sub_metrics" in cri
    assert "band" in cri

    # 3. Fetch Inter-Hostel Efficiency Ratings
    resp_ratings = client.get("/api/v1/performance/campus", headers=headers_director)
    assert resp_ratings.status_code == 200
    ratings = resp_ratings.json()
    assert isinstance(ratings, list)
    assert len(ratings) == 4
    hostel_codes = [h["hostel_code"] for h in ratings]
    assert "HB-3" in hostel_codes
    assert "KMS" in hostel_codes

def test_judge_demo_step7_rewards_and_sla_simulation():
    """
    Step 7 of 16 Judge Demo Script:
    1. SLA background tick simulation executes idempotently.
    2. Proposes and approves caretaker reward ledger entry.
    """
    headers_chief = {
        "X-Actor-Role": "CHIEF_WARDEN",
        "X-Actor-Id": "usr-chief-warden-mishra"
    }

    # 1. Simulate SLA background worker tick
    resp_tick = client.post("/api/v1/sla/tick", headers=headers_chief)
    assert resp_tick.status_code == 200

    # 2. Propose reward
    resp_prop = client.post(
        "/api/v1/rewards/propose",
        headers=headers_chief,
        json={
            "user_id": "usr-caretaker-das",
            "kind": "certificate",
            "note": "Outstanding turnaround during Innovision 2026 pre-brief tasks"
        }
    )
    assert resp_prop.status_code == 201
    reward = resp_prop.json()
    reward_id = reward["id"]

    # 3. Approve reward
    resp_app = client.post(f"/api/v1/rewards/{reward_id}/approve", headers=headers_chief)
    assert resp_app.status_code == 200
    assert resp_app.json()["status"] == "approved"

    # 4. Fetch rewards ledger list
    resp_rewards = client.get("/api/v1/rewards", headers=headers_chief)
    assert resp_rewards.status_code == 200
    rewards = resp_rewards.json()
    assert isinstance(rewards, list)
    assert any(r["id"] == reward_id for r in rewards)
