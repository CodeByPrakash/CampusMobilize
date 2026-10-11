"""
SLA Operations & Email Audit Router (§7, §9, §10)
Exposes on-demand SLA tick execution and email log retrieval.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..workers.sla_worker import SlaWorker
from ..models import EmailLog, Notification

router = APIRouter(tags=["SLA & Notifications"])


@router.post("/sla/tick")
def trigger_sla_tick(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Triggers an idempotent SLA monitoring cycle:
    - Checks active complaints.
    - Sends 75% warnings.
    - Escalates 100% SLA breaches with +10 risk penalty.
    - Enforces P1 45-minute inactivity escalation.
    """
    return SlaWorker.check_and_escalate_tickets(db)


@router.get("/notifications/email-logs")
def list_email_logs(
    template: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Returns the immutable append-only email logs for audit inspections (§10.1)."""
    query = db.query(EmailLog)
    if template:
        query = query.filter(EmailLog.template == template)

    logs = query.order_by(desc(EmailLog.created_at)).limit(limit).all()
    return [
        {
            "id": log.id,
            "template": log.template,
            "to_emails": log.to_emails,
            "cc_emails": log.cc_emails,
            "subject": log.subject,
            "status": log.status,
            "body": log.body,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]
