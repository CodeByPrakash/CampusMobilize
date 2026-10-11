"""
Phase 2 Acceptance Test Suite
Verifies:
1. FastAPI app startup and /api/v1/health check endpoint
2. Database schema initialization and table creation
3. Canonical database seeding (4 hostels, 6 categories, 4 SLA policies, 8 personas)
4. Metadata reference endpoints (/meta/hostels, /meta/categories, /meta/sla-policies)
5. 1-Click demo personas endpoint for frontend instant role-switching
6. REST integration of AI triage and utility forecasting
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

TEST_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(TEST_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app
from app.database import SessionLocal, init_db
from app.seed import seed_database
from app.models import Hostel, User, Category, SlaPolicy


@pytest.fixture(scope="module")
def client():
    # Initialize DB and ensure seed
    init_db()
    with SessionLocal() as session:
        if session.query(Hostel).count() == 0:
            seed_database(session)

    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["campus"] == "NIT Rourkela"
    assert data["offline_mode"] is True


def test_seeded_hostels_and_rooms(client):
    res = client.get("/api/v1/meta/hostels")
    assert res.status_code == 200
    hostels = res.json()
    assert len(hostels) == 4

    codes = [h["code"] for h in hostels]
    assert "HB-3" in codes
    assert "KMS" in codes
    assert "CVR" in codes
    assert "GDB" in codes

    # Check nested blocks and rooms in HB-3
    hb3 = [h for h in hostels if h["code"] == "HB-3"][0]
    assert len(hb3["blocks"]) >= 4
    block_names = [b["name"] for b in hb3["blocks"]]
    assert "A Block" in block_names
    assert "Pump Room Area" in block_names


def test_seeded_categories_and_sla(client):
    res_cat = client.get("/api/v1/meta/categories")
    assert res_cat.status_code == 200
    cats = res_cat.json()
    cat_codes = [c["code"] for c in cats]
    assert "ELECTRICAL" in cat_codes
    assert "WATER" in cat_codes
    assert "HYGIENE" in cat_codes
    assert "CIVIL" in cat_codes
    assert "SECURITY" in cat_codes
    assert "MISC" in cat_codes

    res_sla = client.get("/api/v1/meta/sla-policies")
    assert res_sla.status_code == 200
    slas = res_sla.json()
    priorities = [s["priority"] for s in slas]
    assert "P1" in priorities
    assert "P2" in priorities
    assert "P3" in priorities
    assert "P4" in priorities


def test_demo_personas_for_frontend_switching(client):
    res = client.get("/api/v1/meta/personas")
    assert res.status_code == 200
    personas = res.json()
    assert len(personas) >= 8

    roles = [p["role"] for p in personas]
    assert "STUDENT" in roles
    assert "CR" in roles
    assert "HOSTEL_REP" in roles
    assert "CARETAKER" in roles
    assert "WARDEN" in roles
    assert "CHIEF_WARDEN" in roles
    assert "ESTATE_OFFICER" in roles
    assert "DIRECTOR" in roles

    # Verify Caretaker has skill payload
    caretaker = [p for p in personas if p["role"] == "CARETAKER"][0]
    assert len(caretaker["skills"]) >= 2
    caretaker_skills = [s["skill"] for s in caretaker["skills"]]
    assert "electrical" in caretaker_skills or "plumbing" in caretaker_skills

    # Verify single persona lookup
    res_single = client.get("/api/v1/meta/personas/WARDEN")
    assert res_single.status_code == 200
    warden = res_single.json()
    assert warden["role"] == "WARDEN"
    assert "approve_closure" in warden["permissions"]


def test_ai_triage_endpoint(client):
    payload = {
        "title": "Water leaking near pump room",
        "description": "Continuous leak in the main pipeline of HB-3.",
        "category_code": "WATER",
        "hostel_code": "HB-3",
        "location_text": "Pump Room Area, HB-3",
        "severity": 4,
        "people_affected": 30
    }
    res = client.post("/api/v1/ai/triage", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["category_code"] == "WATER"
    assert data["risk_score"] > 0
    assert data["priority"] in ["P1", "P2", "P3", "P4"]
    assert "matched_caretaker" in data


def test_utility_forecast_endpoint(client):
    payload = {
        "hostel_code": "HB-3",
        "utility": "electricity",
        "target_month": 11,
        "resident_count": 850
    }
    res = client.post("/api/v1/ai/utilities/forecast", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_units"] > 0
    assert data["estimated_amount_inr"] > 0
    assert data["trend_direction"] in ["INCREASING", "DECREASING", "STABLE"]
