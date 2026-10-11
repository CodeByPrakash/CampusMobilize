"""
Offline-Capable Mail Service & Template Dispatcher (§10)
Logs emails to email_log audit table, formats official signature blocks,
and supports simulated offline delivery.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..models import EmailLog, Notification, User, Complaint
from ..config import settings


OFFICIAL_SIGNATURE = """
— CampusIQ Facility Intelligence
  Estate Office, NIT Rourkela
  This is an automated notification. Ticket: {link}
"""


class MailService:
    """
    Renders and sends/logs notification emails per §10.
    """

    @classmethod
    def _create_log(
        cls,
        db: Session,
        template: str,
        to_emails: List[str],
        cc_emails: Optional[List[str]],
        subject: str,
        body: str
    ) -> EmailLog:
        """Writes audit entry to email_log table."""
        now = datetime.now(timezone.utc)
        to_str = ", ".join(to_emails)
        cc_str = ", ".join(cc_emails) if cc_emails else ""

        status = "sent" if settings.MAIL_ENABLED else "sent_simulated"

        log_entry = EmailLog(
            template=template,
            to_emails=to_str,
            cc_emails=cc_str,
            subject=subject,
            body=body,
            status=status,
            sent_at=now,
            created_at=now
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    @classmethod
    def send_p1_urgent_alert(
        cls,
        db: Session,
        complaint: Complaint,
        warden_email: str = "warden.hb3@campusiq.in",
        chief_warden_email: str = "chief.warden@campusiq.in",
        estate_email: str = "estate@campusiq.in"
    ) -> EmailLog:
        """Triggers urgent alert for P1 complaint intake (§10.3)."""
        ticket_link = f"{settings.FRONTEND_URL}/ticket/{complaint.ticket_no}"
        body = f"""To: {warden_email} | Cc: {chief_warden_email}, {estate_email}
Ref: {complaint.ticket_no} | Raised: {complaint.created_at}

SUMMARY
Emergency facility issue lodged at {complaint.location_text or complaint.hostel_code}:
{complaint.title}
{complaint.description}

RISK SCORE: {complaint.risk_score or 82.0}/100 ({complaint.priority})
FACTORS: {complaint.risk_explanation or 'Critical severity event'}
ASSIGNED: Caretaker auto-matched
SLA: 2h | BREACH AT: {complaint.sla_deadline} (auto-escalates to Chief Warden)

Dashboard: {ticket_link}
{OFFICIAL_SIGNATURE.format(link=ticket_link)}
"""
        return cls._create_log(
            db=db,
            template="p1_urgent",
            to_emails=[warden_email],
            cc_emails=[chief_warden_email, estate_email],
            subject=f"[CAMPUSIQ · URGENT] {complaint.ticket_no} {complaint.title} — Action Required",
            body=body.strip()
        )

    @classmethod
    def send_sla_warning(
        cls,
        db: Session,
        complaint: Complaint,
        assignee_email: str,
        warden_email: str
    ) -> EmailLog:
        """Warning sent at 75% SLA threshold (§10.2)."""
        ticket_link = f"{settings.FRONTEND_URL}/ticket/{complaint.ticket_no}"
        body = f"""Ref: {complaint.ticket_no} | Priority: {complaint.priority}
The SLA deadline for this ticket is approaching (75% elapsed).

Ticket: {complaint.title}
Location: {complaint.location_text or 'Hostel'}
SLA Deadline: {complaint.sla_deadline}

Please ensure repair works are updated to IN_PROGRESS or RESOLVED to prevent breach escalation.

{OFFICIAL_SIGNATURE.format(link=ticket_link)}
"""
        return cls._create_log(
            db=db,
            template="sla_warning",
            to_emails=[assignee_email],
            cc_emails=[warden_email],
            subject=f"[CAMPUSIQ · WARNING] SLA 75% Approaching: {complaint.ticket_no} {complaint.title}",
            body=body.strip()
        )

    @classmethod
    def send_sla_escalated(
        cls,
        db: Session,
        complaint: Complaint,
        chief_warden_email: str = "chief.warden@campusiq.in",
        warden_email: str = "warden.hb3@campusiq.in",
        assignee_email: Optional[str] = None
    ) -> EmailLog:
        """Escalation alert sent when 100% SLA window is breached (§10.2)."""
        ticket_link = f"{settings.FRONTEND_URL}/ticket/{complaint.ticket_no}"
        cc_list = [warden_email]
        if assignee_email:
            cc_list.append(assignee_email)

        body = f"""Ref: {complaint.ticket_no} | Priority: {complaint.priority}
CRITICAL SLA BREACH NOTICE
The SLA deadline ({complaint.sla_deadline}) has expired without resolution.

Ticket: {complaint.title}
New Status: ESCALATED (+10 Risk Score applied)
Current Risk Score: {complaint.risk_score}/100

Immediate administrative intervention requested by the Chief Warden's office.

{OFFICIAL_SIGNATURE.format(link=ticket_link)}
"""
        return cls._create_log(
            db=db,
            template="escalated",
            to_emails=[chief_warden_email],
            cc_emails=cc_list,
            subject=f"[CAMPUSIQ · ESCALATION] SLA Breached (+10 Risk): {complaint.ticket_no} {complaint.title}",
            body=body.strip()
        )

    @classmethod
    def send_resolution_pending(
        cls,
        db: Session,
        complaint: Complaint,
        warden_email: str = "warden.hb3@campusiq.in"
    ) -> EmailLog:
        """Notification to Warden when caretaker marks RESOLVED for approval."""
        ticket_link = f"{settings.FRONTEND_URL}/ticket/{complaint.ticket_no}"
        body = f"""Ref: {complaint.ticket_no}
The caretaker has marked this complaint as RESOLVED and submitted resolution evidence.

Completion Note: {complaint.resolution_note}
Verification Photo: {complaint.resolution_photo_url or 'Attached in portal'}

Please inspect and approve closure or reject back with remarks.

{OFFICIAL_SIGNATURE.format(link=ticket_link)}
"""
        return cls._create_log(
            db=db,
            template="resolution_pending",
            to_emails=[warden_email],
            cc_emails=[],
            subject=f"[CAMPUSIQ · APPROVAL NEEDED] Resolution Completed: {complaint.ticket_no} {complaint.title}",
            body=body.strip()
        )

    @classmethod
    def send_ticket_closed(
        cls,
        db: Session,
        complaint: Complaint,
        reporter_email: str,
        rep_email: Optional[str] = None
    ) -> EmailLog:
        """Notification when Warden approves closure."""
        ticket_link = f"{settings.FRONTEND_URL}/ticket/{complaint.ticket_no}"
        cc_list = [rep_email] if rep_email else []
        body = f"""Ref: {complaint.ticket_no}
Your complaint "{complaint.title}" has been successfully resolved and approved by the Warden.

Thank you for reporting facility issues and helping maintain campus infrastructure.

{OFFICIAL_SIGNATURE.format(link=ticket_link)}
"""
        return cls._create_log(
            db=db,
            template="closed",
            to_emails=[reporter_email],
            cc_emails=cc_list,
            subject=f"[CAMPUSIQ] Complaint Closed: {complaint.ticket_no} {complaint.title}",
            body=body.strip()
        )
