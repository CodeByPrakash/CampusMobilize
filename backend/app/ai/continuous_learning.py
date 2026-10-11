"""
CampusIQ Continuous Learning & Active Retraining Engine (§8, §11)
Integrates real data imported from the frontend:
1. Real Utility Bills ingestion -> Drift detection -> Incremental forecaster retraining.
2. Verified Operator/Warden Feedback -> Active learning buffer -> Classifier fine-tuning.
3. Continuous prediction for next month's utility bills, risk anomalies, and budget burns.
Runs 100% offline within the backend.
"""

import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

from .forecaster import UtilityForecaster
from .classifier import ComplaintClassifier

DEFAULT_AI_DIR = os.path.dirname(__file__)
DEFAULT_SEED_DIR = os.path.abspath(os.path.join(DEFAULT_AI_DIR, "..", "..", "seed_data"))
DEFAULT_MODELS_DIR = os.path.join(DEFAULT_AI_DIR, "models")


class ContinuousLearningEngine:
    """
    Manages active feedback buffers, drift detection, and online model updating.
    """

    def __init__(
        self,
        seed_dir: Optional[str] = None,
        models_dir: Optional[str] = None
    ):
        self.seed_dir = seed_dir or DEFAULT_SEED_DIR
        self.models_dir = models_dir or DEFAULT_MODELS_DIR
        os.makedirs(self.seed_dir, exist_ok=True)
        os.makedirs(self.models_dir, exist_ok=True)

        self.bills_buffer_file = os.path.join(self.seed_dir, "active_bills_buffer.json")
        self.feedback_buffer_file = os.path.join(self.seed_dir, "active_feedback_buffer.json")
        self.metadata_file = os.path.join(self.seed_dir, "continuous_learning_meta.json")

        self.forecasters = {
            "electricity": UtilityForecaster(utility="electricity", model_dir=self.models_dir),
            "water": UtilityForecaster(utility="water", model_dir=self.models_dir)
        }
        self.classifier = ComplaintClassifier(
            model_path=os.path.join(self.models_dir, "complaint_classifier.joblib")
        )

        self._init_buffers()

    def _init_buffers(self):
        """Initializes disk-persisted buffers if not existing."""
        if not os.path.exists(self.bills_buffer_file):
            with open(self.bills_buffer_file, "w", encoding="utf-8") as f:
                json.dump([], f)

        if not os.path.exists(self.feedback_buffer_file):
            with open(self.feedback_buffer_file, "w", encoding="utf-8") as f:
                json.dump([], f)

        if not os.path.exists(self.metadata_file):
            meta = {
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_retrained_at": datetime.now(timezone.utc).isoformat(),
                "total_bills_imported": 0,
                "total_feedback_logged": 0,
                "drift_events_detected": 0
            }
            with open(self.metadata_file, "w", encoding="utf-8") as f:
                json.dump(meta, f, indent=2)

    def _load_meta(self) -> Dict[str, Any]:
        try:
            with open(self.metadata_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _save_meta(self, meta: Dict[str, Any]):
        try:
            with open(self.metadata_file, "w", encoding="utf-8") as f:
                json.dump(meta, f, indent=2)
        except Exception as e:
            print(f"[Warning] Failed to save continuous learning meta: {e}")

    # =========================================================================
    # 1. REAL BILLS INGESTION & DRIFT DETECTION
    # =========================================================================
    def ingest_real_bills(
        self,
        new_bills: List[Dict[str, Any]],
        auto_retrain: bool = True
    ) -> Dict[str, Any]:
        """
        Ingests real utility bill rows imported from the frontend (CSV/PDF parser).
        Performs drift detection, updates active bills buffer, and retrains forecaster.
        """
        if not new_bills:
            return {"ingested_count": 0, "message": "No records to ingest"}

        # Load existing buffer
        with open(self.bills_buffer_file, "r", encoding="utf-8") as f:
            buffer: List[Dict[str, Any]] = json.load(f)

        drift_alerts = []
        ingested = []

        for bill in new_bills:
            record = dict(bill)
            record["ingested_at"] = datetime.now(timezone.utc).isoformat()
            utility = record.get("utility", "electricity").lower()
            units = float(record.get("units_consumed", 0.0))
            hostel = record.get("hostel_code", "HB-3")

            # Drift Detection against current forecaster baseline
            month_int = 10
            if "bill_month" in record:
                try:
                    month_int = int(record["bill_month"].split("-")[1])
                except Exception:
                    pass

            forecaster = self.forecasters.get(utility)
            expected = forecaster.predict(month=month_int, resident_count=int(record.get("resident_count", 600)))
            expected_units = expected["predicted_units"]
            ci_upper = expected["upper_ci"]
            ci_lower = expected["lower_ci"]

            # If real units exceed 90% confidence upper bound, flag high drift
            if units > ci_upper * 1.15:
                drift_alerts.append({
                    "hostel": hostel,
                    "utility": utility,
                    "actual_units": units,
                    "expected_units": expected_units,
                    "type": "SURGE_ANOMALY",
                    "deviation_pct": round(((units - expected_units) / max(1.0, expected_units)) * 100, 1),
                    "note": f"Significant surge in {utility} at {hostel} exceeding 90% CI upper bound"
                })

            buffer.append(record)
            ingested.append(record)

        # Save buffer
        with open(self.bills_buffer_file, "w", encoding="utf-8") as f:
            json.dump(buffer, f, indent=2)

        meta = self._load_meta()
        meta["total_bills_imported"] = meta.get("total_bills_imported", 0) + len(ingested)
        meta["drift_events_detected"] = meta.get("drift_events_detected", 0) + len(drift_alerts)

        # Trigger progressive model retraining if requested
        retrain_summary = {}
        if auto_retrain and len(ingested) > 0:
            retrain_summary = self.retrain_utility_models()
            meta["last_retrained_at"] = datetime.now(timezone.utc).isoformat()

        self._save_meta(meta)

        return {
            "ingested_count": len(ingested),
            "total_buffer_count": len(buffer),
            "drift_alerts": drift_alerts,
            "retrained": auto_retrain,
            "retrain_metrics": retrain_summary
        }

    def retrain_utility_models(self) -> Dict[str, Any]:
        """
        Merges seed 36m bills with active buffer and updates model artifacts.
        """
        # Load seed bills
        seed_bills_path = os.path.join(self.seed_dir, "utility_bills_36m.json")
        all_records = []
        if os.path.exists(seed_bills_path):
            with open(seed_bills_path, "r", encoding="utf-8") as f:
                all_records.extend(json.load(f))

        # Append buffer bills
        with open(self.bills_buffer_file, "r", encoding="utf-8") as f:
            buffer_bills = json.load(f)
            all_records.extend(buffer_bills)

        results = {}
        for util in ["electricity", "water"]:
            fc = self.forecasters[util]
            try:
                res = fc.train_on_records(all_records, save_artifact=True)
                results[util] = {
                    "samples": res["samples"],
                    "mae": res["mae"],
                    "rmse": res["rmse"]
                }
            except Exception as e:
                results[util] = {"error": str(e)}

        return results

    # =========================================================================
    # 2. OPERATOR FEEDBACK & VERIFIED CORRECTIONS INGESTION
    # =========================================================================
    def ingest_operator_feedback(
        self,
        ticket_no: str,
        title: str,
        description: str,
        corrected_category: str,
        corrected_severity: Optional[int] = None,
        actor_role: str = "WARDEN",
        auto_retrain: bool = False
    ) -> Dict[str, Any]:
        """
        Logs verified ground-truth corrections when Hostel Rep / Warden overrides
        category or risk. Updates feedback buffer.
        """
        sample = {
            "ticket_no": ticket_no,
            "title": title,
            "description": description,
            "category_code": corrected_category,
            "severity": corrected_severity or 3,
            "actor_role": actor_role,
            "weight": 3.0,  # Higher sample loss weight for human supervisor corrections
            "logged_at": datetime.now(timezone.utc).isoformat()
        }

        with open(self.feedback_buffer_file, "r", encoding="utf-8") as f:
            buffer = json.load(f)
        buffer.append(sample)
        with open(self.feedback_buffer_file, "w", encoding="utf-8") as f:
            json.dump(buffer, f, indent=2)

        meta = self._load_meta()
        meta["total_feedback_logged"] = meta.get("total_feedback_logged", 0) + 1
        self._save_meta(meta)

        # If 10+ supervisor corrections logged, trigger classifier fine-tuning
        retrain_result = None
        if auto_retrain or len(buffer) >= 10:
            retrain_result = self.retrain_classifier_with_feedback()

        return {
            "status": "FEEDBACK_LOGGED",
            "ticket_no": ticket_no,
            "buffer_size": len(buffer),
            "retrained": retrain_result is not None,
            "retrain_metrics": retrain_result
        }

    def retrain_classifier_with_feedback(self) -> Dict[str, Any]:
        """
        Merges base complaint seed data with active feedback buffer and fine-tunes classifier.
        """
        seed_complaints_file = os.path.join(self.seed_dir, "complaint_train.jsonl")
        temp_merged_file = os.path.join(self.seed_dir, "complaint_active_merged.jsonl")

        with open(temp_merged_file, "w", encoding="utf-8") as out_f:
            # 1. Base seed complaints
            if os.path.exists(seed_complaints_file):
                with open(seed_complaints_file, "r", encoding="utf-8") as in_f:
                    for line in in_f:
                        if line.strip():
                            out_f.write(line.strip() + "\n")

            # 2. Append operator feedback samples (repeated by weight for sample importance)
            with open(self.feedback_buffer_file, "r", encoding="utf-8") as in_f:
                feedbacks = json.load(in_f)
                for fb in feedbacks:
                    repeat_count = int(fb.get("weight", 3.0))
                    entry = json.dumps({
                        "ticket_no": fb.get("ticket_no"),
                        "title": fb.get("title"),
                        "description": fb.get("description"),
                        "category_code": fb.get("category_code")
                    })
                    for _ in range(repeat_count):
                        out_f.write(entry + "\n")

        # Retrain classifier
        res = self.classifier.train(temp_merged_file, save_artifact=True)
        return res

    # =========================================================================
    # 3. CONTINUOUS PREDICTION FOR NEXT MONTH'S CONSUMPTION & BILLS
    # =========================================================================
    def predict_next_bill(
        self,
        hostel_code: str,
        utility: str,
        target_month: int,
        resident_count: int,
        tariff_rate: Optional[float] = None,
        event_multiplier: float = 1.0
    ) -> Dict[str, Any]:
        """
        Generates forward-looking consumption prediction, 90% CI bounds,
        estimated bill amount in INR, and trend indicator using the updated models.
        """
        util = utility.lower()
        forecaster = self.forecasters.get(util)
        if not forecaster:
            forecaster = UtilityForecaster(utility=util, model_dir=self.models_dir)
            self.forecasters[util] = forecaster

        forecast = forecaster.predict(
            month=target_month,
            resident_count=resident_count,
            event_multiplier=event_multiplier
        )

        t_rate = tariff_rate or (6.85 if util == "electricity" else 18.50)
        pred_units = forecast["predicted_units"]
        estimated_amount_inr = round(pred_units * t_rate, 2)
        lower_amount_inr = round(forecast["lower_ci"] * t_rate, 2)
        upper_amount_inr = round(forecast["upper_ci"] * t_rate, 2)

        # Historical comparison for trend
        prev_month = 12 if target_month == 1 else (target_month - 1)
        prev_forecast = forecaster.predict(month=prev_month, resident_count=resident_count)
        delta_pct = round(((pred_units - prev_forecast["predicted_units"]) / max(1.0, prev_forecast["predicted_units"])) * 100, 1)

        trend = "STABLE"
        if delta_pct >= 5.0:
            trend = "INCREASING"
        elif delta_pct <= -5.0:
            trend = "DECREASING"

        return {
            "hostel_code": hostel_code,
            "utility": util,
            "target_month": target_month,
            "resident_count": resident_count,
            "predicted_units": pred_units,
            "unit_name": "kWh" if util == "electricity" else "kL",
            "lower_ci": forecast["lower_ci"],
            "upper_ci": forecast["upper_ci"],
            "estimated_amount_inr": estimated_amount_inr,
            "confidence_interval_inr": {
                "lower_inr": lower_amount_inr,
                "upper_inr": upper_amount_inr
            },
            "tariff_rate": t_rate,
            "trend_direction": trend,
            "delta_from_previous_month_pct": delta_pct,
            "is_heuristic": forecast.get("is_heuristic", False),
            "model_status": "ONLINE_ADAPTIVE"
        }

    # =========================================================================
    # 4. SYSTEM HEALTH & MONITORING STATUS
    # =========================================================================
    def get_status(self) -> Dict[str, Any]:
        """Returns comprehensive continuous learning status for admin/command dashboards."""
        meta = self._load_meta()
        with open(self.bills_buffer_file, "r", encoding="utf-8") as f:
            bills_count = len(json.load(f))
        with open(self.feedback_buffer_file, "r", encoding="utf-8") as f:
            feedback_count = len(json.load(f))

        return {
            "continuous_learning_active": True,
            "total_real_bills_ingested": bills_count,
            "total_operator_feedback_logged": feedback_count,
            "drift_events_detected": meta.get("drift_events_detected", 0),
            "last_retrained_at": meta.get("last_retrained_at"),
            "models": {
                "electricity_forecaster": {
                    "loaded": self.forecasters["electricity"].model_median is not None,
                    "mae": self.forecasters["electricity"].mae
                },
                "water_forecaster": {
                    "loaded": self.forecasters["water"].model_median is not None,
                    "mae": self.forecasters["water"].mae
                },
                "complaint_classifier": {
                    "loaded": self.classifier.pipeline is not None
                }
            }
        }
