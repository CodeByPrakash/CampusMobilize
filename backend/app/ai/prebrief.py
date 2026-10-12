"""
Campus Event Pre-Brief Synthesis Engine (8.5)
Synthesizes actionable, official operational pre-briefs for upcoming campus events
(Innovision, Nitrutsav, Technozion, End-sem exams) using forecaster outputs and operational guidelines.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, date


class PreBriefGenerator:
    """
    Synthesizes festival & occasion operational pre-briefs per 8.5.
    """

    @staticmethod
    def generate_prebrief(
        event: Dict[str, Any],
        today: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Generates formatted pre-brief card and official email notification payload.
        """
        today = today or date.today()

        name = event.get("name", "Campus Event")
        kind = event.get("kind", "festival")
        starts_on_str = event.get("starts_on", str(today))
        
        try:
            starts_on = datetime.strptime(starts_on_str[:10], "%Y-%m-%d").date()
            days_left = max(0, (starts_on - today).days)
        except Exception:
            days_left = 7

        water_mult = float(event.get("water_surge_multiplier", 1.0))
        elec_mult = float(event.get("electricity_surge_multiplier", 1.0))
        hygiene_mult = float(event.get("hygiene_pressure_multiplier", 1.0))
        
        water_pct = int(round((water_mult - 1.0) * 100))
        elec_pct = int(round((elec_mult - 1.0) * 100))
        hygiene_x = round(hygiene_mult, 1)

        budget_inr = int(event.get("budget_estimate_inr", 52000))
        critical_hostels = event.get("critical_hostels", ["HB-3", "CVR", "KMS"])
        hostels_str = ", ".join(critical_hostels)

        custom_recs = event.get("recommendations", [])
        if not custom_recs:
            custom_recs = [
                f"Pre-inspect pumps and overhead tanks in {hostels_str} 48h prior",
                "Schedule 4 additional sweepers per residential block during peak meal hours",
                "Stage emergency electrical repair kits with on-call technicians",
                f"Reserve provisional emergency contingency budget of ₹{budget_inr:,}"
            ]

        # Plain language summary (8.5 text template)
        short_summary = (
            f"{name} in {days_left} days — predicted water demand +{water_pct}%, "
            f"electricity +{elec_pct}%, hygiene complaints ×{hygiene_x}. "
            f"Recommended: pre-inspect pumps in {hostels_str}; "
            f"schedule extra sanitation staff; budget ≈ ₹{budget_inr:,}."
        )

        structured_summary = {
            "headline": f"{name} in {days_left} days: Major campus footfall influx requiring autonomous facility readiness across {hostels_str}.",
            "water_analysis": f"Water demand surge of +{water_pct}%. Sump storage drawdowns will reach critical levels without 100% pre-fill 12h prior and standby tankers at Hall 14 & Hall 3.",
            "electricity_analysis": f"Peak grid demand surge of +{elec_pct}%. Dual-feed breaker check scheduled; stage lighting cutover locked until 18:30 to shave coincident transformer peaks.",
            "sanitation_analysis": f"Hygiene complaint load multiplying by ×{hygiene_x}. Washroom inspection cycle reduced from 8h to 4h with 2 roving emergency plumbers.",
            "budget_analysis": f"Estate provisional contingency budget of ₹{budget_inr:,} approved for fuel top-up, tanker freight, and overtime maintenance squads."
        }

        key_actions = [
            f"Pre-inspect pumps and overhead tanks in {hostels_str} 48h prior",
            "Pre-fill all hostel overhead and underground sumps to 100% 12h prior",
            "Position 2 standby 10,000L PHED tankers between Hall 14 & Hall 3",
            "Lock non-essential chiller units during 18:30–22:00 peak hours",
            "Deploy 4 additional sanitation sweepers per residential block",
            f"Authorize provisional emergency contingency budget of ₹{budget_inr:,}"
        ]

        full_brief = {
            "event_name": name,
            "event_kind": kind,
            "days_until": days_left,
            "starts_on": starts_on_str,
            "predicted_surges": {
                "water_surge_pct": water_pct,
                "electricity_surge_pct": elec_pct,
                "hygiene_pressure_multiplier": hygiene_x
            },
            "critical_hostels": critical_hostels,
            "budget_inr": budget_inr,
            "recommendations": custom_recs,
            "summary_text": short_summary,
            "structured_summary": structured_summary,
            "key_actions": key_actions
        }

        return full_brief
