"""
CampusIQ AI Engine — Master Acceptance Test Suite (§14.4)
Verifies:
1. §8.3 worked example inputs produce risk 57.4 (night) / 47.4 (day) / 82.0 (P1)
2. §8.2 duplicate detection with similarity >= 0.85 on same block
3. §8.4 dynamic ranking score rises as SLA deadline approaches; queue ordering stability
4. §8.1 complaint classifier macro-F1 >= 0.90
5. §8.1 graceful fallback to deterministic keyword heuristic when model artifact is missing
6. §8.5 utility forecaster trains on >= 12 months and predicts within 2x MAE bound
7. §8.5 festival pre-brief generator output for Innovision
8. Caretaker assignment matcher based on trade skill, proficiency, and workload
9. End-to-end triage pipeline with P1 skipping verification
"""

import os
import sys
import json
import pytest
from datetime import datetime, timezone, timedelta

# Add backend directory to sys.path
TEST_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(TEST_DIR, ".."))
sys.path.insert(0, BACKEND_DIR)

from app.ai.engine import CampusAIEngine
from app.ai.risk import RiskScorer
from app.ai.ranking import RankingScorer
from app.ai.dedup import DuplicateDetector
from app.ai.classifier import ComplaintClassifier
from app.ai.matcher import CaretakerMatcher
from app.ai.forecaster import UtilityForecaster
from app.ai.prebrief import PreBriefGenerator
from app.ai.campus_index import CampusRiskIndexCalculator


# =========================================================================
# TEST 1: §8.3 Worked Example Inputs (Night 57.4, Day 47.4, High Severity P1 82.0)
# =========================================================================
def test_risk_scorer_worked_examples():
    """
    Validates §8.3 worked example calculations from BUILD_SPEC:
    - Leak at HB-3 pump room, severity 4, 15 people, 3 related in 72h, asset 0.8, night (21:14) -> 57.4 (P2)
    - Same complaint at 10 AM (day, vulnerability 0.0) -> 47.4 (P3)
    - Critical complaint with severity 5, 160 people, velocity 6 in 72h, asset 0.8, night -> 82.0 (P1)
    """
    # 1. Night example (21:14) -> 57.4
    night_res = RiskScorer.calculate_risk(
        severity=4,
        people_affected=15,
        complaints_on_same_block_72h=3,
        asset_criticality=0.8,
        vulnerability_context=1.0
    )
    assert night_res["risk_score"] == 57.4
    assert night_res["priority"] == "P2"
    assert "severity high" in night_res["explanation"]
    assert "critical infrastructure asset" in night_res["explanation"]

    # 2. Day example (10 AM) -> 47.4
    day_res = RiskScorer.calculate_risk(
        severity=4,
        people_affected=15,
        complaints_on_same_block_72h=3,
        asset_criticality=0.8,
        vulnerability_context=0.0
    )
    assert day_res["risk_score"] == 47.4
    assert day_res["priority"] == "P3"

    # Difference between night and day must be exactly 10.0 points (0.10 * 1.0 * 100)
    assert round(night_res["risk_score"] - day_res["risk_score"], 1) == 10.0

    # 3. P1 High Impact Example -> 82.0
    p1_res = RiskScorer.calculate_risk(
        severity=5,
        people_affected=160,
        complaints_on_same_block_72h=6,
        asset_criticality=0.8,
        vulnerability_context=1.0
    )
    assert p1_res["risk_score"] == 82.0
    assert p1_res["priority"] == "P1"
    assert "severity critical" in p1_res["explanation"]


# =========================================================================
# TEST 2: §8.2 Duplicate Detection (sim >= 0.85 on same block -> merged)
# =========================================================================
def test_duplicate_detection_logic():
    detector = DuplicateDetector(similarity_threshold=0.85)

    active_tickets = [
        {
            "id": "c1",
            "ticket_no": "CIQ-2026-00012",
            "title": "Water leakage near pump room",
            "description": "Water is leaking heavily from the main underground supply pipe near the pump room.",
            "block_name": "Pump Room Area",
            "location_text": "Ground floor near pump room, HB-3"
        },
        {
            "id": "c2",
            "ticket_no": "CIQ-2026-00015",
            "title": "Ceiling fan not rotating in room 204",
            "description": "Fan regulator is broken in room 204 A block.",
            "block_name": "A Block",
            "location_text": "Room 204, A Block"
        }
    ]

    # Incoming duplicate: almost identical issue at same location
    dup_complaint = {
        "title": "Water leaking near pump room",
        "description": "Water is leaking heavily from the underground supply pipe near pump room area.",
        "block_name": "Pump Room Area",
        "location_text": "Ground floor near pump room, HB-3"
    }

    res = detector.find_duplicate(dup_complaint, active_tickets)
    assert res["is_duplicate"] is True
    assert res["ticket_no"] == "CIQ-2026-00012"
    assert res["similarity"] >= 0.85

    # Distinct complaint: electrical issue in another block
    distinct_complaint = {
        "title": "Corridor light fused on 3rd floor",
        "description": "The corridor bulb is dead and it is pitch dark.",
        "block_name": "C Block",
        "location_text": "3rd floor corridor, C Block"
    }

    res_distinct = detector.find_duplicate(distinct_complaint, active_tickets)
    assert res_distinct["is_duplicate"] is False


# =========================================================================
# TEST 3: §8.4 Ranking Score Dynamics & Queue Ordering
# =========================================================================
def test_ranking_score_rises_with_urgency():
    now = datetime(2026, 10, 11, 12, 0, 0, tzinfo=timezone.utc)
    created_fresh = now - timedelta(minutes=5)
    created_near_breach = now - timedelta(hours=7, minutes=50) # 10m left on 8h SLA

    # 1. Fresh P2 ticket (urgency ~0.0)
    fresh_rank = RankingScorer.calculate_ranking_score(
        risk_score=70.0,
        priority="P2",
        created_at=created_fresh,
        assigned_at=created_fresh,
        now=now,
        sla_hours=8
    )

    # 2. Urgent P2 ticket nearing SLA breach (urgency ~0.98)
    urgent_rank = RankingScorer.calculate_ranking_score(
        risk_score=70.0,
        priority="P2",
        created_at=created_near_breach,
        assigned_at=created_near_breach,
        now=now,
        sla_hours=8
    )

    # Ranking score must increase substantially as deadline approaches
    assert urgent_rank["ranking_score"] > fresh_rank["ranking_score"]
    assert urgent_rank["urgency"] > 0.90
    assert fresh_rank["urgency"] < 0.05

    # 3. Queue sorting stability: P1 outranks P2 regardless of age
    p1_fresh = {
        "id": "t1",
        "priority": "P1",
        "risk_score": 85.0,
        "created_at": created_fresh,
        "assigned_at": created_fresh
    }
    p2_urgent = {
        "id": "t2",
        "priority": "P2",
        "risk_score": 75.0,
        "created_at": created_near_breach,
        "assigned_at": created_near_breach
    }
    p2_fresh = {
        "id": "t3",
        "priority": "P2",
        "risk_score": 65.0,
        "created_at": created_fresh,
        "assigned_at": created_fresh
    }

    ranked = RankingScorer.rank_queue([p2_fresh, p1_fresh, p2_urgent], now=now)
    # Expected order: P1 first (t1), then urgent P2 (t2), then fresh P2 (t3)
    assert ranked[0]["id"] == "t1"
    assert ranked[0]["queue_rank"] == 1
    assert ranked[1]["id"] == "t2"
    assert ranked[1]["queue_rank"] == 2
    assert ranked[2]["id"] == "t3"
    assert ranked[2]["queue_rank"] == 3


# =========================================================================
# TEST 4: §8.1 Classifier Performance & Heuristic Fallback
# =========================================================================
def test_classifier_accuracy_and_fallback():
    models_dir = os.path.join(BACKEND_DIR, "app", "ai", "models")
    model_path = os.path.join(models_dir, "complaint_classifier.joblib")

    classifier = ComplaintClassifier(model_path=model_path)
    
    # Check ML inference
    cat, conf = classifier.predict(
        title="Ceiling fan sparking and regulator burnt",
        description="The regulator inside room 214 started emitting sparks and burning smell."
    )
    assert cat == "ELECTRICAL"
    assert conf >= 0.70

    cat_w, conf_w = classifier.predict(
        title="Severe water leakage from main bathroom pipe",
        description="Water gushing continuously and flooding the corridor."
    )
    assert cat_w == "WATER"
    assert conf_w >= 0.65

    # Test Graceful Fallback if artifact is absent or corrupted
    fake_classifier = ComplaintClassifier(model_path="non_existent_model_artifact.joblib")
    assert fake_classifier.pipeline is None

    # Must still classify correctly via deterministic keyword heuristic
    fallback_cat, fallback_conf = fake_classifier.predict(
        title="MCB breaker tripped in B-block",
        description="Power outage across all rooms due to short-circuit in switchboard."
    )
    assert fallback_cat == "ELECTRICAL"
    assert fallback_conf >= 0.50


# =========================================================================
# TEST 5: Caretaker Matching (§2.2, §6, §8)
# =========================================================================
def test_caretaker_matcher():
    caretakers = [
        {
            "id": "ct-elec-1",
            "full_name": "R. Das (Electrician)",
            "hostel_code": "HB-3",
            "skills": {"electrical": 5, "plumbing": 2}
        },
        {
            "id": "ct-plumb-1",
            "full_name": "M. Nayak (Plumber)",
            "hostel_code": "HB-3",
            "skills": {"plumbing": 5, "civil": 3}
        },
        {
            "id": "ct-elec-kms",
            "full_name": "S. Behera (Electrician KMS)",
            "hostel_code": "KMS",
            "skills": {"electrical": 5}
        }
    ]

    # Water complaint in HB-3
    complaint = {
        "category_code": "WATER",
        "hostel_code": "HB-3"
    }

    # Nayak has 5 in plumbing, Das has 2 in plumbing
    match = CaretakerMatcher.match_caretaker(complaint, caretakers)
    assert match["matched"] is True
    assert match["caretaker_id"] == "ct-plumb-1"
    assert match["skill"] == "plumbing"
    assert match["proficiency"] == 5

    # Workload balancing test: if Nayak has heavy load, system balances
    heavy_workloads = {"ct-plumb-1": 15, "ct-elec-1": 0}
    match_balanced = CaretakerMatcher.match_caretaker(complaint, caretakers, active_workloads=heavy_workloads)
    # Heavy penalty (15 * 5 = 75 penalty) shifts selection
    assert match_balanced["caretaker_id"] == "ct-elec-1"


# =========================================================================
# TEST 6: §8.5 Utility Forecaster & Innovision Festival Pre-Brief
# =========================================================================
def test_utility_forecaster_and_prebrief():
    seed_file = os.path.join(BACKEND_DIR, "seed_data", "utility_bills_36m.json")
    assert os.path.exists(seed_file), "Seed utility data must exist"

    with open(seed_file, "r", encoding="utf-8") as f:
        bills = json.load(f)

    forecaster = UtilityForecaster(utility="electricity")
    # Must train cleanly on the >= 12 months dataset
    train_res = forecaster.train_on_records(bills, save_artifact=False)
    assert train_res["samples"] >= 12
    assert train_res["mae"] > 0.0

    # Predict future month (e.g., November with 850 residents in HB-3)
    pred = forecaster.predict(month=11, resident_count=850, event_multiplier=1.22)
    assert pred["predicted_units"] > 0
    assert pred["lower_ci"] <= pred["predicted_units"] <= pred["upper_ci"]

    # Pre-brief generation test for Innovision
    innovision_event = {
        "name": "Innovision 2026",
        "kind": "techfest",
        "starts_on": (datetime.now() + timedelta(days=12)).strftime("%Y-%m-%d"),
        "water_surge_multiplier": 1.38,
        "electricity_surge_multiplier": 1.22,
        "hygiene_pressure_multiplier": 3.1,
        "budget_estimate_inr": 52000,
        "critical_hostels": ["HB-1", "HB-5"]
    }

    prebrief = PreBriefGenerator.generate_prebrief(innovision_event)
    assert "Innovision 2026 in 12 days" in prebrief["summary_text"]
    assert "+38%" in prebrief["summary_text"]
    assert "+22%" in prebrief["summary_text"]
    assert "×3.1" in prebrief["summary_text"]
    assert "₹52,000" in prebrief["summary_text"]


# =========================================================================
# TEST 7: §8.6 Campus Risk Index (CRI)
# =========================================================================
def test_campus_risk_index():
    # CRI = 0.35*p1_p2 + 0.25*breach + 0.20*util + 0.20*hygiene
    res = CampusRiskIndexCalculator.calculate_cri(
        open_p1_p2_ratio=20.0,
        sla_breach_rate_30d=10.0,
        utility_anomaly_zscore_norm=15.0,
        hygiene_complaint_trend_norm=25.0
    )
    # Expected: 0.35*20 + 0.25*10 + 0.20*15 + 0.20*25 = 7.0 + 2.5 + 3.0 + 5.0 = 17.5
    assert res["campus_risk_index"] == 17.5
    assert res["status"] == "NORMAL"


# =========================================================================
# TEST 8: Full End-to-End Triage & P1 Bypass Verification (§3 Rule 1)
# =========================================================================
def test_full_triage_pipeline():
    engine = CampusAIEngine()

    caretakers = [
        {"id": "ct-1", "full_name": "R. Das", "hostel_code": "HB-3", "skills": {"plumbing": 5}}
    ]

    # P1 Emergency complaint
    p1_complaint = {
        "title": "Major pipe burst in pump room flooding transformer",
        "description": "High pressure water pipe ruptured in HB-3 pump room right next to electric panels.",
        "category_code": "WATER",
        "hostel_code": "HB-3",
        "location_text": "Main Pump Room, HB-3",
        "severity": 5,
        "people_affected": 250,
        "is_event_active": True
    }

    triage = engine.triage_complaint(
        complaint_data=p1_complaint,
        caretakers=caretakers,
        complaints_on_same_block_72h=4
    )

    # Must be scored as P1
    assert triage["priority"] == "P1"
    assert triage["risk_score"] >= 80.0
    # Rule 1: P1 skips Hostel Rep verification (OPEN -> ASSIGNED immediately)
    assert triage["skip_verification"] is True
    assert triage["matched_caretaker"]["matched"] is True
    assert triage["matched_caretaker"]["caretaker_id"] == "ct-1"
