"""
Phase 5 Test Suite: Utilities, Forecasting API, Events & Rewards (§7.6, §7.7, §7.9, §8.5, §11)
Tests bill parsing, quantile consumption forecasts, festival pre-brief generator,
Caretaker Performance Index (PI), Hostel Efficiency Rating (ER), Rewards ledger, and CSV exports.
"""

import pytest
from datetime import datetime, timezone, date
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database import SessionLocal, init_db
from backend.app.seed import seed_database
from backend.app.models import UtilityBill, CampusEvent, Hostel, User, RewardLedger


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure database is seeded before tests run."""
    init_db()
    with SessionLocal() as session:
        if session.query(Hostel).count() == 0 or session.query(UtilityBill).count() == 0:
            seed_database(session)
    yield


@pytest.fixture
def client():
    return TestClient(app)


def test_utility_bill_creation_and_listing(client):
    """Test manual intake of utility bill row and listing with hostel filters."""
    payload = {
        "utility": "electricity",
        "bill_month": "2026-10-01",
        "units_consumed": 98500.0,
        "amount_inr": 674725.0,
        "hostel_code": "HB-3"
    }
    r = client.post("/api/v1/utilities/bills", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["units_consumed"] == 98500.0
    assert data["utility"] == "electricity"
    assert data["tariff_rate"] == 6.85

    # List bills
    list_res = client.get("/api/v1/utilities/bills?utility=electricity&hostel_code=HB-3")
    assert list_res.status_code == 200
    bills = list_res.json()
    assert len(bills) >= 1
    assert bills[0]["hostel_code"] == "HB-3"


def test_bill_upload_parser(client):
    """Test text extractor and bill parser (§8.5)."""
    bill_text = """
    TPWODL ELECTRICITY BILL - NIT ROURKELA HB-3
    Billing Month: 2026-09-01
    Units Consumed: 96,200.00 kWh
    Total Amount: INR 6,58,970.00
    Tariff: 6.85 INR/kWh
    """
    res = client.post("/api/v1/utilities/bills/upload", params={"text_content": bill_text, "hostel_code": "HB-3"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "INGESTED"
    assert data["confidence"] >= 0.80
    assert data["extracted"]["units_consumed"] == 96200.0


def test_quantile_utility_forecasts(client):
    """Test quantile forecast generation with 90% confidence intervals (§8.5)."""
    res = client.get("/api/v1/utilities/forecasts?utility=electricity&months_ahead=3&hostel_code=HB-3")
    assert res.status_code == 200
    data = res.json()
    assert data["utility"] == "electricity"
    assert data["months_ahead"] == 3
    assert len(data["predictions"]) == 3

    p0 = data["predictions"][0]
    assert "predicted_units" in p0
    assert "p10" in p0
    assert "p90" in p0
    # Lower bound must be <= upper bound
    assert p0["p10"] <= p0["p90"]


def test_campus_events_and_prebrief_generation(client):
    """Test event management and festival pre-brief operational package (§8.5)."""
    # 1. List events (seeded)
    ev_res = client.get("/api/v1/events")
    assert ev_res.status_code == 200
    events = ev_res.json()
    assert len(events) >= 1

    innovision = next((e for e in events if "Innovision" in e["name"]), events[0])

    # 2. Generate pre-brief
    pb_res = client.post(f"/api/v1/events/{innovision['id']}/prebrief")
    assert pb_res.status_code == 200
    pb = pb_res.json()

    assert "estimated_budget_inr" in pb
    assert "critical_hostels" in pb
    assert "staffing_plan" in pb
    assert "contingency_checklist" in pb
    assert len(pb["contingency_checklist"]) >= 3


def test_caretaker_performance_index_pi(client):
    """Test Caretaker Performance Index (PI) calculation (§11.1)."""
    # 1. Staff self-scorecard
    me_res = client.get("/api/v1/performance/me", headers={"X-Actor-Id": "usr-caretaker-das"})
    assert me_res.status_code == 200
    sc = me_res.json()
    assert "performance_index" in sc
    assert 0.0 <= sc["performance_index"] <= 100.0
    assert "sla_compliance_pct" in sc
    assert "first_time_resolution_pct" in sc

    # 2. Hostel caretaker table (Warden view)
    hb3_res = client.get("/api/v1/performance/hostel/HB-3")
    assert hb3_res.status_code == 200
    cts = hb3_res.json()
    assert len(cts) >= 1
    assert cts[0]["hostel_rank"] == 1


def test_hostel_efficiency_rating_er(client):
    """Test dignified cross-hostel ranking table (ER) (§11.3)."""
    res = client.get("/api/v1/performance/campus")
    assert res.status_code == 200
    table = res.json()
    assert len(table) == 4  # HB-3, KMS, CVR, GDB

    codes = [h["hostel_code"] for h in table]
    assert set(codes) == {"HB-3", "KMS", "CVR", "GDB"}
    assert table[0]["campus_rank"] == 1
    assert 0.0 <= table[0]["efficiency_rating"] <= 100.0


def test_rewards_propose_and_approve(client):
    """Test proposing and approving caretaker rewards (§11.2)."""
    # 1. Propose certificate
    prop_res = client.post("/api/v1/rewards/propose", json={
        "user_id": "usr-caretaker-das",
        "kind": "certificate",
        "note": "Exceptional turnaround on water pump emergency"
    })
    assert prop_res.status_code == 201
    reward = prop_res.json()
    assert reward["status"] == "proposed"
    assert reward["kind"] == "certificate"

    # 2. Approve by Chief Warden
    app_res = client.post(f"/api/v1/rewards/{reward['id']}/approve")
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "approved"

    # 3. Verify in rewards list
    list_res = client.get("/api/v1/rewards")
    assert list_res.status_code == 200
    assert any(r["id"] == reward["id"] for r in list_res.json())


def test_reports_monthly_pack_and_csv_export(client):
    """Test monthly report pack generation and executive CSV exports (§7.9)."""
    # 1. Monthly report
    rep_res = client.get("/api/v1/reports/monthly")
    assert rep_res.status_code == 200
    pack = rep_res.json()
    assert "report_title" in pack
    assert "hostel_breakdown" in pack
    assert len(pack["hostel_breakdown"]) == 4

    # 2. Export complaints CSV
    csv_c = client.get("/api/v1/reports/export.csv?dataset=complaints")
    assert csv_c.status_code == 200
    assert csv_c.headers["content-type"] == "text/csv; charset=utf-8"
    assert "Ticket No,Title" in csv_c.text

    # 3. Export utility bills CSV
    csv_b = client.get("/api/v1/reports/export.csv?dataset=bills")
    assert csv_b.status_code == 200
    assert "Hostel,Utility,Bill Month" in csv_b.text


def test_campus_risk_index_endpoint(client):
    """Test real-time Campus Risk Index API (§8.6)."""
    res = client.get("/api/v1/analytics/risk-index")
    assert res.status_code == 200
    cri = res.json()
    assert "campus_risk_index" in cri
    assert 0.0 <= cri["campus_risk_index"] <= 100.0
    assert cri["band"] in ["LOW", "NORMAL", "MODERATE", "ELEVATED", "CRITICAL", "CRITICAL_ALERT"]
    assert "sub_metrics" in cri
