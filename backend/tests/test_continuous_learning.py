"""
Continuous Learning & Active Retraining Engine Test Suite
Tests:
1. Ingestion of real bills imported from frontend with anomaly/drift detection.
2. Automatic progressive model retraining updating forecaster artifacts.
3. Operator feedback ingestion (human supervisor category/risk corrections).
4. Forward-looking bill and consumption predictions for next month with 90% CI and trend.
5. Consolidated AI engine learning status endpoint data.
"""

import os
import sys
import pytest
from datetime import datetime, timezone

TEST_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(TEST_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.ai.engine import CampusAIEngine
from app.ai.continuous_learning import ContinuousLearningEngine


@pytest.fixture
def ai_engine():
    return CampusAIEngine()


def test_real_bills_ingestion_and_drift_detection(ai_engine):
    # Simulate a real electricity bill imported from frontend
    new_bills = [
        {
            "hostel_code": "HB-3",
            "utility": "electricity",
            "bill_month": "2026-11-01",
            "units_consumed": 78500.0,
            "amount_inr": 537725.0,
            "tariff_rate": 6.85,
            "resident_count": 850
        },
        # Simulate an extreme surge bill (e.g. pump running 24x7 or meter fault)
        {
            "hostel_code": "KMS",
            "utility": "water",
            "bill_month": "2026-11-01",
            "units_consumed": 12500.0, # Normal for 620 residents is ~2600 kL
            "amount_inr": 231250.0,
            "tariff_rate": 18.50,
            "resident_count": 620
        }
    ]

    res = ai_engine.ingest_real_bills(new_bills, auto_retrain=True)

    assert res["ingested_count"] == 2
    assert res["retrained"] is True
    assert "retrain_metrics" in res

    # Verify drift detection caught the extreme surge in water
    drift_alerts = res["drift_alerts"]
    assert len(drift_alerts) >= 1
    water_alert = [a for a in drift_alerts if a["utility"] == "water"][0]
    assert water_alert["type"] == "SURGE_ANOMALY"
    assert water_alert["hostel"] == "KMS"
    assert water_alert["deviation_pct"] > 50.0


def test_operator_feedback_ingestion(ai_engine):
    # Simulate a Warden overriding an intake classification
    res = ai_engine.ingest_operator_feedback(
        ticket_no="CIQ-2026-00045",
        title="Strange noise from corridor panel",
        description="The panel on 1st floor corridor is humming loudly and feels hot.",
        corrected_category="ELECTRICAL",
        corrected_severity=4,
        actor_role="WARDEN"
    )

    assert res["status"] == "FEEDBACK_LOGGED"
    assert res["ticket_no"] == "CIQ-2026-00045"
    assert res["buffer_size"] >= 1


def test_predict_next_bill_with_confidence_and_trend(ai_engine):
    # Predict next month (December) electricity for HB-3
    pred = ai_engine.predict_next_bill(
        hostel_code="HB-3",
        utility="electricity",
        target_month=12,
        resident_count=850,
        tariff_rate=6.85,
        event_multiplier=1.0
    )

    assert pred["hostel_code"] == "HB-3"
    assert pred["utility"] == "electricity"
    assert pred["target_month"] == 12
    assert pred["predicted_units"] > 0
    assert pred["lower_ci"] <= pred["predicted_units"] <= pred["upper_ci"]
    assert pred["estimated_amount_inr"] > 0
    assert pred["confidence_interval_inr"]["lower_inr"] <= pred["estimated_amount_inr"] <= pred["confidence_interval_inr"]["upper_inr"]
    assert pred["trend_direction"] in ["INCREASING", "DECREASING", "STABLE"]


def test_learning_status_reporting(ai_engine):
    status = ai_engine.get_learning_status()

    assert status["continuous_learning_active"] is True
    assert "total_real_bills_ingested" in status
    assert "total_operator_feedback_logged" in status
    assert "last_retrained_at" in status
    assert status["models"]["electricity_forecaster"]["loaded"] is True
    assert status["models"]["water_forecaster"]["loaded"] is True
    assert status["models"]["complaint_classifier"]["loaded"] is True
