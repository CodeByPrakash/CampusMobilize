"""
Deterministic Risk Scoring & Priority Engine (§8.3)
Computes multi-factor risk score (0–100), maps priority bands (P1–P4),
and synthesizes plain-language factor explanations for audit trails.
"""

from typing import Dict, Any, Optional
from datetime import datetime


ASSET_CRITICALITY_MAP = {
    # 1.0: Fire safety / High voltage transformers / Main substations / Live exposed wires
    "fire": 1.0,
    "fire-safety": 1.0,
    "transformer": 1.0,
    "440v": 1.0,
    "high voltage": 1.0,
    "exposed wire": 1.0,
    "naked wire": 1.0,
    "sparking": 1.0,
    "emergency exit": 1.0,
    "life-safety": 1.0,

    # 0.8: Pumps / Main electrical panels / Substation / Main water lines
    "pump": 0.8,
    "pump room": 0.8,
    "electrical panel": 0.8,
    "substation": 0.8,
    "main supply": 0.8,
    "overhead tank": 0.8,
    "sewage chamber": 0.8,

    # 0.6: Corridors / Common washrooms / Mess / Dining / Balcony / Stairs
    "corridor": 0.6,
    "washroom": 0.6,
    "bathroom": 0.6,
    "mess": 0.6,
    "dining": 0.6,
    "staircase": 0.6,
    "balcony": 0.6,
    "reading room": 0.6,

    # 0.2: General room / Study table / Personal fixtures
    "room": 0.2,
    "general room": 0.2,
    "hostel room": 0.2,
    "bed": 0.2
}


class RiskScorer:
    """
    Autonomous risk scoring engine implementing §8.3 formula.
    """

    @staticmethod
    def get_asset_criticality(
        location_text: Optional[str],
        asset_type: Optional[str] = None,
        text_content: Optional[str] = None
    ) -> float:
        """Maps location/asset/text keywords to criticality coefficient (0.2 - 1.0)."""
        combined = f"{location_text or ''} {asset_type or ''} {text_content or ''}".lower()
        for key, val in ASSET_CRITICALITY_MAP.items():
            if key in combined:
                return val
        return 0.4  # Default intermediate criticality

    @staticmethod
    def get_vulnerability_context(
        timestamp: Optional[datetime] = None,
        is_event_active: bool = False,
        is_exam_week: bool = False,
        hour: Optional[int] = None
    ) -> float:
        """
        Determines vulnerability coefficient:
        1.0 during active festivals/events or night hours (22:00–06:00 or 21:00+)
        0.4 during exam weeks
        0.0 / 0.2 for routine daylight hours
        """
        if is_event_active:
            return 1.0

        h = hour
        if h is None and timestamp is not None:
            h = timestamp.hour

        if h is not None:
            # 21:00 to 06:00 night window
            if h >= 21 or h < 6:
                return 1.0

        if is_exam_week:
            return 0.4

        return 0.0

    @classmethod
    def calculate_risk(
        cls,
        severity: int,
        people_affected: int,
        complaints_on_same_block_72h: int,
        asset_criticality: float,
        vulnerability_context: float,
        is_escalated: bool = False
    ) -> Dict[str, Any]:
        """
        Calculates normalized risk score (0–100) per §8.3:
        risk = 100 * (0.30*sev_norm + 0.25*people_norm + 0.20*velocity + 0.15*asset + 0.10*vuln)
        """
        severity = max(1, min(5, int(severity)))
        severity_norm = (severity - 1.0) / 4.0

        # In spec worked example: 15-30 people normalized against 400
        # If people_affected is provided, we compute norm
        people_affected_norm = min(float(people_affected) / 400.0, 1.0)

        escalation_velocity = min(float(complaints_on_same_block_72h) / 5.0, 1.0)
        asset_crit = max(0.0, min(1.0, float(asset_criticality)))
        vuln = max(0.0, min(1.0, float(vulnerability_context)))

        # Weighted composite score
        base_risk = 100.0 * (
            0.30 * severity_norm +
            0.25 * people_affected_norm +
            0.20 * escalation_velocity +
            0.15 * asset_crit +
            0.10 * vuln
        )

        if is_escalated:
            base_risk += 10.0

        risk_score = round(min(100.0, max(0.0, base_risk)), 1)

        # NOTE(spec): §8.3 Line 550 explicitly designates risk 57.4 -> P2 (night) and 47.4 -> P3 (day).
        # We align the P2 threshold to 55.0 so 57.4 maps to P2 and 47.4 maps to P3 per the worked example.
        # Life-safety critical events (severity 5 with life-safety asset criticality 1.0) qualify for emergency P1.
        if risk_score >= 80.0 or (severity == 5 and asset_crit >= 1.0):
            priority = "P1"
            risk_score = max(risk_score, 82.0)
        elif risk_score >= 55.0:
            priority = "P2"
        elif risk_score >= 40.0:
            priority = "P3"
        else:
            priority = "P4"

        # Generate human-readable explanation factors (§8.3)
        factors = []
        sev_label = "critical" if severity == 5 else ("high" if severity >= 4 else ("medium" if severity == 3 else "low"))
        factors.append(f"severity {sev_label}")

        if people_affected > 1:
            factors.append(f"{people_affected} people affected")

        if complaints_on_same_block_72h > 0:
            factors.append(f"{complaints_on_same_block_72h} related complaints in 72h")

        if asset_crit >= 0.8:
            factors.append("critical infrastructure asset")
        elif asset_crit >= 0.6:
            factors.append("common area asset")

        if vuln >= 1.0:
            factors.append("night hours / active event vulnerability")
        elif vuln >= 0.4:
            factors.append("exam period context")

        if is_escalated:
            factors.append("SLA breach escalation penalty (+10)")

        factors_str = " · ".join(factors)
        explanation = f"Risk {risk_score} ({priority}): {factors_str}."

        return {
            "risk_score": risk_score,
            "priority": priority,
            "explanation": explanation,
            "factors": {
                "severity_norm": round(severity_norm, 3),
                "people_affected_norm": round(people_affected_norm, 3),
                "escalation_velocity": round(escalation_velocity, 3),
                "asset_criticality": round(asset_crit, 3),
                "vulnerability_context": round(vuln, 3)
            }
        }
