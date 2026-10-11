"""
Autonomous SLA Engine & Background Worker (§7.4, §9, §12)
Runs periodic or on-demand checks on active tickets:
- Issues warning at 75% SLA deadline elapsed.
- Auto-escalates at 100% SLA breach (+10 risk penalty, event log, email to Chief Warden).
- Enforces P1 45-minute inactivity escalation.
"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..models import Complaint, ComplaintEvent, Notification, EmailLog, User, Hostel
from ..services.mail_service import MailService


class SlaWorker:
    """
    Idempotent SLA monitor checking tickets across NIT Rourkela hostels.
    """

    @classmethod
    def check_and_escalate_tickets(
        cls,
        db: Session,
        now: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Executes a single SLA assessment cycle over all active complaints.
        """
        if now is None:
            now = datetime.now(timezone.utc)

        # Active complaints excluding finalized states
        active_tickets = db.query(Complaint).filter(
            ~Complaint.status.in_(["CLOSED", "REJECTED"])
        ).all()

        checked_count = len(active_tickets)
        warned_count = 0
        escalated_count = 0
        p1_alerts_count = 0

        for ticket in active_tickets:
            # 1. P1 45-Minute Inactivity Escalation (§6.2, §7.4, §10.2)
            if ticket.priority == "P1" and ticket.status in ["OPEN", "ASSIGNED"]:
                inactivity_mins = (now - ticket.created_at.replace(tzinfo=timezone.utc if ticket.created_at.tzinfo is None else ticket.created_at.tzinfo)).total_seconds() / 60.0
                if inactivity_mins >= 45.0 and ticket.status != "ESCALATED":
                    from_status = ticket.status
                    ticket.status = "ESCALATED"
                    ticket.risk_score = min(100.0, (ticket.risk_score or 80.0) + 10.0)

                    event = ComplaintEvent(
                        complaint_id=ticket.id,
                        from_status=from_status,
                        to_status="ESCALATED",
                        actor_id="system-sla-worker",
                        actor_role="SLA_WORKER",
                        note=f"P1 45-minute inactivity breach ({int(inactivity_mins)}m idle). Auto-escalated to Chief Warden.",
                        created_at=now
                    )
                    db.add(event)

                    MailService.send_sla_escalated(
                        db=db,
                        complaint=ticket,
                        chief_warden_email="chief.warden@campusiq.in",
                        warden_email="warden.hb3@campusiq.in"
                    )
                    p1_alerts_count += 1
                    escalated_count += 1
                    continue

            # 2. General SLA Deadline Assessment (75% Warning & 100% Breach)
            if ticket.sla_deadline is not None:
                deadline = ticket.sla_deadline.replace(tzinfo=timezone.utc if ticket.sla_deadline.tzinfo is None else ticket.sla_deadline.tzinfo)
                start_time = (ticket.assigned_at or ticket.created_at).replace(tzinfo=timezone.utc if (ticket.assigned_at or ticket.created_at).tzinfo is None else (ticket.assigned_at or ticket.created_at).tzinfo)

                total_window_sec = (deadline - start_time).total_seconds()
                if total_window_sec > 0:
                    elapsed_sec = (now - start_time).total_seconds()
                    ratio = elapsed_sec / total_window_sec

                    # 100% Breach -> ESCALATED
                    if ratio >= 1.0 and ticket.status != "ESCALATED":
                        from_status = ticket.status
                        ticket.status = "ESCALATED"
                        ticket.risk_score = min(100.0, (ticket.risk_score or 50.0) + 10.0)

                        event = ComplaintEvent(
                            complaint_id=ticket.id,
                            from_status=from_status,
                            to_status="ESCALATED",
                            actor_id="system-sla-worker",
                            actor_role="SLA_WORKER",
                            note=f"SLA deadline breached. Applied +10 risk penalty (new score: {ticket.risk_score}). Auto-escalated to Chief Warden.",
                            created_at=now
                        )
                        db.add(event)

                        MailService.send_sla_escalated(
                            db=db,
                            complaint=ticket,
                            chief_warden_email="chief.warden@campusiq.in",
                            warden_email="warden.hb3@campusiq.in"
                        )
                        escalated_count += 1

                    # 75% Warning Threshold
                    elif 0.75 <= ratio < 1.0 and ticket.status in ["ASSIGNED", "IN_PROGRESS"]:
                        # Check if warning was already dispatched
                        already_warned = db.query(EmailLog).filter(
                            EmailLog.template == "sla_warning",
                            EmailLog.subject.like(f"%{ticket.ticket_no}%")
                        ).first()

                        if not already_warned:
                            assignee = db.query(User).filter(User.id == ticket.assigned_to).first()
                            assignee_email = assignee.email if assignee else "caretaker.hb3@campusiq.in"

                            MailService.send_sla_warning(
                                db=db,
                                complaint=ticket,
                                assignee_email=assignee_email,
                                warden_email="warden.hb3@campusiq.in"
                            )
                            warned_count += 1

        db.commit()
        return {
            "timestamp": now.isoformat(),
            "checked_count": checked_count,
            "warned_count": warned_count,
            "escalated_count": escalated_count,
            "p1_alerts_count": p1_alerts_count
        }
