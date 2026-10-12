"""
Dynamic Work Queue Ranking Engine (8.4)
Recomputes dynamic urgency and ranking score based on SLA deadline approach.
Ensures P1 always outranks lower classes, while approaching breaches rise to the top.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone


SLA_HOURS_DEFAULT = {
    "P1": 2,     # 2 hours
    "P2": 8,     # 8 hours
    "P3": 48,    # 48 hours
    "P4": 168    # 7 days (168 hours)
}

PRIORITY_RANK_ORDER = {
    "P1": 1,
    "P2": 2,
    "P3": 3,
    "P4": 4
}


class RankingScorer:
    """
    Computes ranking score and sorts work queues according to 8.4.
    """

    @classmethod
    def calculate_ranking_score(
        cls,
        risk_score: float,
        priority: str,
        created_at: datetime,
        assigned_at: Optional[datetime] = None,
        now: Optional[datetime] = None,
        sla_hours: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Computes dynamic urgency and ranking_score (8.4):
        sla_total = sla_hours(priority) * 3600
        elapsed   = now - assigned_at (or now - created_at)
        urgency   = max(0, 1 - remaining/sla_total)
        ranking_score = risk * (1 + 0.5 * urgency^2)
        """
        now = now or datetime.now(timezone.utc)
        
        # Ensure timezone compatibility
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        if assigned_at is not None and assigned_at.tzinfo is None:
            assigned_at = assigned_at.replace(tzinfo=timezone.utc)

        start_time = assigned_at if assigned_at is not None else created_at
        sla_h = sla_hours or SLA_HOURS_DEFAULT.get(priority, 48)
        sla_total_sec = max(60.0, sla_h * 3600.0)

        elapsed_sec = max(0.0, (now - start_time).total_seconds())
        remaining_sec = max(0.0, sla_total_sec - elapsed_sec)

        # Urgency: 0.0 (fresh) -> 1.0 (at or past deadline)
        urgency = max(0.0, min(1.0, 1.0 - (remaining_sec / sla_total_sec)))

        # Dynamic ranking score boosts up to +50% at deadline breach
        ranking_score = round(float(risk_score) * (1.0 + 0.5 * (urgency ** 2)), 2)

        return {
            "ranking_score": ranking_score,
            "urgency": round(urgency, 3),
            "elapsed_seconds": int(elapsed_sec),
            "remaining_seconds": int(remaining_sec),
            "sla_hours": sla_h,
            "is_breached": elapsed_sec >= sla_total_sec
        }

    @classmethod
    def rank_queue(
        cls,
        tickets: List[Dict[str, Any]],
        now: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Sorts active tickets by (priority class asc, ranking_score desc).
        Annotates each ticket with queue_rank and formatted status string.
        """
        now = now or datetime.now(timezone.utc)

        scored_tickets = []
        for t in tickets:
            ticket = dict(t)
            priority = ticket.get("priority", "P3")
            risk = float(ticket.get("risk_score", 50.0))

            created_at = ticket.get("created_at")
            if isinstance(created_at, str):
                try:
                    created_at = datetime.fromisoformat(created_at)
                except Exception:
                    created_at = now
            elif not isinstance(created_at, datetime):
                created_at = now

            assigned_at = ticket.get("assigned_at")
            if isinstance(assigned_at, str):
                try:
                    assigned_at = datetime.fromisoformat(assigned_at)
                except Exception:
                    assigned_at = None

            rank_res = cls.calculate_ranking_score(
                risk_score=risk,
                priority=priority,
                created_at=created_at,
                assigned_at=assigned_at,
                now=now
            )

            ticket["ranking_score"] = rank_res["ranking_score"]
            ticket["urgency"] = rank_res["urgency"]
            ticket["is_breached"] = rank_res["is_breached"]
            ticket["_p_order"] = PRIORITY_RANK_ORDER.get(priority, 99)
            scored_tickets.append(ticket)

        # Sort order: priority order ascending (P1=1, P2=2...), then ranking_score descending
        scored_tickets.sort(key=lambda x: (x["_p_order"], -x["ranking_score"]))

        total = len(scored_tickets)
        for idx, item in enumerate(scored_tickets, start=1):
            item["queue_rank"] = idx
            item["queue_display"] = f"RISK {int(item.get('risk_score', 0))} · QUEUE #{idx} of {total}"
            item.pop("_p_order", None)

        return scored_tickets
