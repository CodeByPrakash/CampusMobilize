"""
CampusIQ AI Engine Facade (§8)
Autonomous Facility Intelligence Engine coordinating offline classification,
duplicate detection, risk scoring, ranking, caretaker matching, and utility forecasting.
Runs 100% offline with zero external API calls.
"""

import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from .classifier import ComplaintClassifier
from .dedup import DuplicateDetector
from .risk import RiskScorer
from .ranking import RankingScorer
from .matcher import CaretakerMatcher
from .forecaster import UtilityForecaster
from .prebrief import PreBriefGenerator
from .bill_parser import BillParser
from .campus_index import CampusRiskIndexCalculator
from .continuous_learning import ContinuousLearningEngine


class CampusAIEngine:
    """
    Unified offline AI engine facade for CampusIQ Campus Edition.
    """

    def __init__(self, models_dir: Optional[str] = None):
        self.models_dir = models_dir or os.path.join(os.path.dirname(__file__), "models")
        os.makedirs(self.models_dir, exist_ok=True)

        self.classifier = ComplaintClassifier(
            model_path=os.path.join(self.models_dir, "complaint_classifier.joblib")
        )
        self.dedup_detector = DuplicateDetector(similarity_threshold=0.85)
        self.risk_scorer = RiskScorer()
        self.ranking_scorer = RankingScorer()
        self.caretaker_matcher = CaretakerMatcher()
        
        self.forecasters = {
            "electricity": UtilityForecaster(utility="electricity", model_dir=self.models_dir),
            "water": UtilityForecaster(utility="water", model_dir=self.models_dir)
        }
        self.prebrief_generator = PreBriefGenerator()
        self.bill_parser = BillParser()
        self.cri_calculator = CampusRiskIndexCalculator()
        self.continuous_learning = ContinuousLearningEngine(models_dir=self.models_dir)

    def triage_complaint(
        self,
        complaint_data: Dict[str, Any],
        active_complaints: Optional[List[Dict[str, Any]]] = None,
        caretakers: Optional[List[Dict[str, Any]]] = None,
        active_workloads: Optional[Dict[str, int]] = None,
        complaints_on_same_block_72h: int = 0,
        now: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Executes complete intelligent intake triage in a single call:
        1. Classifies category and confidence (§8.1)
        2. Detects duplicate complaints in the same hostel (§8.2)
        3. Calculates risk score, priority (P1–P4), and factor explanation (§8.3)
        4. Matches suitable caretaker by skill and workload (§2.2, §6)
        5. Computes ranking score and initial work queue metrics (§8.4)
        """
        now = now or datetime.now(timezone.utc)
        title = complaint_data.get("title", "")
        description = complaint_data.get("description", "")
        location_text = complaint_data.get("location_text", "")
        severity = int(complaint_data.get("severity") or 3)
        people_affected = int(complaint_data.get("people_affected") or 1)

        # 1. Classification
        assigned_category = complaint_data.get("category_code")
        if not assigned_category or assigned_category == "AUTO":
            category_code, cat_conf = self.classifier.predict(title, description)
        else:
            # Validate or assess confidence for user-selected category
            pred_cat, cat_conf = self.classifier.predict(title, description)
            category_code = assigned_category
            if pred_cat == assigned_category:
                cat_conf = max(cat_conf, 0.85)
            else:
                cat_conf = 0.70

        # 2. Duplicate Detection
        active_complaints = active_complaints or []
        dedup_res = self.dedup_detector.find_duplicate(
            new_complaint={
                "title": title,
                "description": description,
                "block_name": complaint_data.get("block_name"),
                "block_id": complaint_data.get("block_id"),
                "location_text": location_text
            },
            active_complaints=active_complaints
        )

        # 3. Risk Scoring (§8.3)
        asset_crit = self.risk_scorer.get_asset_criticality(
            location_text=location_text,
            text_content=f"{title} {description}"
        )
        vuln_ctx = self.risk_scorer.get_vulnerability_context(
            timestamp=now,
            is_event_active=complaint_data.get("is_event_active", False),
            is_exam_week=complaint_data.get("is_exam_week", False)
        )

        risk_res = self.risk_scorer.calculate_risk(
            severity=severity,
            people_affected=people_affected,
            complaints_on_same_block_72h=complaints_on_same_block_72h,
            asset_criticality=asset_crit,
            vulnerability_context=vuln_ctx,
            is_escalated=False
        )

        priority = risk_res["priority"]
        risk_score = risk_res["risk_score"]

        # 4. Caretaker Matching (§2.2, §6)
        caretakers = caretakers or []
        match_res = self.caretaker_matcher.match_caretaker(
            complaint={
                "category_code": category_code,
                "hostel_code": complaint_data.get("hostel_code"),
                "hostel_id": complaint_data.get("hostel_id")
            },
            caretakers=caretakers,
            active_workloads=active_workloads or {}
        )

        # 5. Ranking Score (§8.4)
        rank_res = self.ranking_scorer.calculate_ranking_score(
            risk_score=risk_score,
            priority=priority,
            created_at=now,
            assigned_at=now if priority == "P1" else None,
            now=now
        )

        return {
            "category_code": category_code,
            "category_confidence": cat_conf,
            "is_duplicate": dedup_res["is_duplicate"],
            "duplicate_of": dedup_res["duplicate_of"],
            "duplicate_similarity": dedup_res["similarity"],
            "duplicate_reason": dedup_res["reason"],
            "risk_score": risk_score,
            "priority": priority,
            "risk_explanation": risk_res["explanation"],
            "risk_factors": risk_res["factors"],
            "ranking_score": rank_res["ranking_score"],
            "urgency": rank_res["urgency"],
            "matched_caretaker": match_res,
            "skip_verification": priority == "P1"  # P1 skips verify per §3 rule 1
        }

    def rank_queue(self, tickets: List[Dict[str, Any]], now: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Sorts and annotates work queue by priority and dynamic urgency."""
        return self.ranking_scorer.rank_queue(tickets, now)

    def forecast_utility(
        self,
        utility: str,
        month: int,
        resident_count: int,
        event_multiplier: float = 1.0
    ) -> Dict[str, float]:
        """Predicts monthly utility consumption with 90% confidence bounds."""
        utility_key = utility.lower()
        forecaster = self.forecasters.get(utility_key)
        if not forecaster:
            forecaster = UtilityForecaster(utility=utility_key, model_dir=self.models_dir)
            self.forecasters[utility_key] = forecaster
        return forecaster.predict(month=month, resident_count=resident_count, event_multiplier=event_multiplier)

    def generate_prebrief(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesizes official festival pre-brief card."""
        return self.prebrief_generator.generate_prebrief(event)

    def parse_bill_file(self, content: str, is_csv: bool = True) -> List[Dict[str, Any]]:
        """Extracts structured billing records from uploaded file content."""
        if is_csv:
            return self.bill_parser.parse_csv(content)
        return [self.bill_parser.parse_text(content)]

    def compute_campus_risk_index(
        self,
        open_p1_p2_ratio: float,
        sla_breach_rate_30d: float,
        utility_anomaly_zscore: float,
        hygiene_complaint_trend: float
    ) -> Dict[str, Any]:
        """Computes daily CRI score for the Director dashboard."""
        return self.cri_calculator.calculate_cri(
            open_p1_p2_ratio=open_p1_p2_ratio,
            sla_breach_rate_30d=sla_breach_rate_30d,
            utility_anomaly_zscore_norm=utility_anomaly_zscore,
            hygiene_complaint_trend_norm=hygiene_complaint_trend
        )

    # =========================================================================
    # Continuous Learning & Adaptive Prediction System
    # =========================================================================
    def ingest_real_bills(self, new_bills: List[Dict[str, Any]], auto_retrain: bool = True) -> Dict[str, Any]:
        """Ingests real bills imported from frontend, checks for drift, and retrains forecaster."""
        return self.continuous_learning.ingest_real_bills(new_bills, auto_retrain=auto_retrain)

    def ingest_operator_feedback(
        self,
        ticket_no: str,
        title: str,
        description: str,
        corrected_category: str,
        corrected_severity: Optional[int] = None,
        actor_role: str = "WARDEN"
    ) -> Dict[str, Any]:
        """Ingests verified category/risk corrections from Hostel Rep or Warden."""
        return self.continuous_learning.ingest_operator_feedback(
            ticket_no=ticket_no,
            title=title,
            description=description,
            corrected_category=corrected_category,
            corrected_severity=corrected_severity,
            actor_role=actor_role
        )

    def predict_next_bill(
        self,
        hostel_code: str,
        utility: str,
        target_month: int,
        resident_count: int,
        tariff_rate: Optional[float] = None,
        event_multiplier: float = 1.0
    ) -> Dict[str, Any]:
        """Predicts next month's utility consumption and bill amount with CI and trend."""
        return self.continuous_learning.predict_next_bill(
            hostel_code=hostel_code,
            utility=utility,
            target_month=target_month,
            resident_count=resident_count,
            tariff_rate=tariff_rate,
            event_multiplier=event_multiplier
        )

    def get_learning_status(self) -> Dict[str, Any]:
        """Returns online continuous learning metrics and drift alerts."""
        return self.continuous_learning.get_status()

    def trigger_continuous_retraining(self, target: str = "all") -> Dict[str, Any]:
        """Manually triggers continuous learning retraining across forecasters and/or classifier."""
        return self.continuous_learning.trigger_retraining(target=target)

