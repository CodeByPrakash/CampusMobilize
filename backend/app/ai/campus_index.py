"""
Campus Risk Index (CRI) Calculator (8.6)
Computes campus-wide composite operational risk index (0–100) for the Director & Chief Warden dashboards:
CRI = 0.35×open_P1_P2_ratio + 0.25×sla_breach_rate_30d + 0.20×utility_anomaly_zscore + 0.20×hygiene_complaint_trend
"""

from typing import Dict, Any


class CampusRiskIndexCalculator:
    """
    Computes composite Campus Risk Index (CRI) per 8.6.
    """

    @classmethod
    def calculate_cri(
        cls,
        open_p1_p2_ratio: float,          # 0 to 100
        sla_breach_rate_30d: float,       # 0 to 100
        utility_anomaly_zscore_norm: float, # 0 to 100
        hygiene_complaint_trend_norm: float # 0 to 100
    ) -> Dict[str, Any]:
        """
        Calculates composite CRI score (0–100).
        """
        p1_ratio = max(0.0, min(100.0, float(open_p1_p2_ratio)))
        breach_rate = max(0.0, min(100.0, float(sla_breach_rate_30d)))
        util_norm = max(0.0, min(100.0, float(utility_anomaly_zscore_norm)))
        hygiene_norm = max(0.0, min(100.0, float(hygiene_complaint_trend_norm)))

        cri_score = round(
            0.35 * p1_ratio +
            0.25 * breach_rate +
            0.20 * util_norm +
            0.20 * hygiene_norm,
            1
        )

        cri_score = max(0.0, min(100.0, cri_score))

        if cri_score >= 70.0:
            status = "CRITICAL_ALERT"
            status_label = "Severe Operational Strain"
            badge_color = "red"
        elif cri_score >= 45.0:
            status = "ELEVATED"
            status_label = "Heightened Attention Advised"
            badge_color = "amber"
        else:
            status = "NORMAL"
            status_label = "Optimal Facility Health"
            badge_color = "emerald"

        return {
            "campus_risk_index": cri_score,
            "status": status,
            "status_label": status_label,
            "badge_color": badge_color,
            "band": status,
            "components": {
                "open_p1_p2_ratio": round(p1_ratio, 1),
                "sla_breach_rate_30d": round(breach_rate, 1),
                "utility_anomaly_norm": round(util_norm, 1),
                "hygiene_trend_norm": round(hygiene_norm, 1)
            },
            "sub_metrics": {
                "open_p1_p2_ratio": round(p1_ratio, 1),
                "sla_breach_rate_30d": round(breach_rate, 1),
                "utility_anomaly_norm": round(util_norm, 1),
                "hygiene_trend_norm": round(hygiene_norm, 1)
            }
        }
