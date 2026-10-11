"""
Resend Mail Service & Template Dispatcher (§10)
Dispatches live transactional notification emails via Resend API (resend.com)
with responsive HTML templates, official NIT Rourkela branding, and DB audit logging.
"""

import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import resend
from resend.exceptions import ResendError

from ..models import EmailLog, Notification, User, Complaint
from ..config import settings


OFFICIAL_SIGNATURE_TEXT = """
— CampusIQ Facility Intelligence
  Estate Office, NIT Rourkela
  This is an automated notification. Ticket: {link}
"""

def generate_branded_html_email(
    title: str,
    badge_label: str,
    badge_bg: str,
    ticket_no: str,
    summary_html: str,
    details: List[Dict[str, str]],
    cta_url: str,
    cta_text: str = "View in CampusIQ Dashboard"
) -> str:
    """Renders a modern, responsive email with clean white card aesthetic and NIT Rourkela branding."""
    rows_html = "".join([
        f"""
        <tr>
          <td style="padding: 8px 12px; color: #64748b; font-size: 13px; font-weight: 500; border-bottom: 1px solid #f1f5f9;">{d['label']}</td>
          <td style="padding: 8px 12px; color: #0f172a; font-size: 13px; font-weight: 600; border-bottom: 1px solid #f1f5f9;">{d['value']}</td>
        </tr>
        """
        for d in details
    ])

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; text-align: left;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #38bdf8; font-weight: 700;">NIT Rourkela · Facility Operations</div>
              <div style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 4px;">CampusIQ Incident Dispatch</div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 24px;">
              <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; background-color: {badge_bg}; color: #ffffff; margin-right: 8px;">{badge_label}</span>
                <span style="font-size: 13px; color: #64748b; font-weight: 600;">Ticket #{ticket_no}</span>
              </div>

              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; line-height: 1.3;">{title}</h2>
              <div style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
                {summary_html}
              </div>

              <!-- Metadata Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                {rows_html}
              </table>

              <!-- Action Button -->
              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="{cta_url}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
                  {cta_text} &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              <div>Estate & Works Office, National Institute of Technology Rourkela</div>
              <div style="margin-top: 4px;">Automated Facility-Intelligence Alert · Please do not reply directly to this email.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


class MailService:
    """
    Transactional email delivery service using Resend (resend.com)
    with database audit logging in email_log table.
    """

    @classmethod
    def _dispatch_and_log(
        cls,
        db: Session,
        template: str,
        to_emails: List[str],
        cc_emails: Optional[List[str]],
        subject: str,
        body_text: str,
        html_content: Optional[str] = None
    ) -> EmailLog:
        """Dispatches email via Resend API and records entry in email_log table."""
        now = datetime.now(timezone.utc)
        to_str = ", ".join(to_emails)
        cc_str = ", ".join(cc_emails) if cc_emails else ""

        api_key = settings.RESEND_API_KEY or os.environ.get("RESEND_API_KEY", "")
        status = "sent_simulated"

        if api_key:
            resend.api_key = api_key
            from_sender = settings.RESEND_FROM or "CampusIQ <onboarding@resend.dev>"
            params: resend.Emails.SendParams = {
                "from": from_sender,
                "to": to_emails,
                "subject": subject,
                "text": body_text,
                "html": html_content or f"<pre style='font-family:sans-serif;'>{body_text}</pre>",
            }
            if cc_emails:
                params["cc"] = cc_emails

            try:
                email_resp = resend.Emails.send(params)
                print(f"[Resend] Successfully dispatched email via Resend API: {email_resp}")
                status = "sent"
            except ResendError as error:
                print(f"[Resend Notice] Resend API response: {error}")
                status = f"failed: {str(error)[:24]}"
            except Exception as e:
                print(f"[Resend Notice] Dispatch exception: {e}")
                status = f"failed: {str(e)[:24]}"
        else:
            print(f"[Resend Notice] RESEND_API_KEY is not set. Logged as sent_simulated to database.")

        log_entry = EmailLog(
            template=template,
            to_emails=to_str,
            cc_emails=cc_str,
            subject=subject,
            body=body_text,
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
        ticket_link = f"{settings.FRONTEND_URL}/#ticket-{complaint.ticket_no}"
        body_text = f"""To: {warden_email} | Cc: {chief_warden_email}, {estate_email}
Ref: {complaint.ticket_no} | Raised: {complaint.created_at}

EMERGENCY FACILITY ISSUE LODGED:
{complaint.title}
{complaint.description}

LOCATION: {complaint.location_text or complaint.hostel_code}
RISK SCORE: {complaint.risk_score or 82.0}/100 ({complaint.priority})
FACTORS: {complaint.risk_explanation or 'Critical safety/infrastructure hazard'}
SLA DEADLINE: {complaint.sla_deadline or '2 Hours'} (Auto-escalation enforced)

Dashboard: {ticket_link}
{OFFICIAL_SIGNATURE_TEXT.format(link=ticket_link)}
"""

        details = [
            {"label": "Hostel / Location", "value": complaint.location_text or "HB-3"},
            {"label": "Priority / SLA", "value": f"{complaint.priority} · 2 Hours SLA"},
            {"label": "Risk Score", "value": f"{complaint.risk_score or 82.0} / 100"},
            {"label": "Breach Deadline", "value": str(complaint.sla_deadline or 'Immediate')},
            {"label": "Assigned Tradesman", "value": "Senior Caretaker (Auto-Assigned)"}
        ]

        html_content = generate_branded_html_email(
            title=f"URGENT: {complaint.title}",
            badge_label="P1 EMERGENCY",
            badge_bg="#dc2626",
            ticket_no=complaint.ticket_no,
            summary_html=f"A critical priority issue has been lodged and auto-assigned. <strong>Immediate intervention required.</strong><br><br><em>{complaint.description}</em>",
            details=details,
            cta_url=ticket_link,
            cta_text="Open Incident Command"
        )

        return cls._dispatch_and_log(
            db=db,
            template="p1_urgent",
            to_emails=[warden_email],
            cc_emails=[chief_warden_email, estate_email],
            subject=f"[CAMPUSIQ · URGENT P1] {complaint.ticket_no} {complaint.title} — Action Required",
            body_text=body_text.strip(),
            html_content=html_content
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
        ticket_link = f"{settings.FRONTEND_URL}/#ticket-{complaint.ticket_no}"
        body_text = f"""Ref: {complaint.ticket_no} | Priority: {complaint.priority}
The SLA deadline for this ticket is approaching (75% elapsed).

Ticket: {complaint.title}
Location: {complaint.location_text or 'Hostel'}
SLA Deadline: {complaint.sla_deadline}

Please ensure repair works are updated to IN_PROGRESS or RESOLVED to prevent breach escalation.

{OFFICIAL_SIGNATURE_TEXT.format(link=ticket_link)}
"""

        details = [
            {"label": "Ticket Title", "value": complaint.title},
            {"label": "Hostel Location", "value": complaint.location_text or "Hostel"},
            {"label": "Priority Class", "value": complaint.priority or "P2"},
            {"label": "SLA Deadline", "value": str(complaint.sla_deadline or 'Approaching')},
        ]

        html_content = generate_branded_html_email(
            title=f"SLA Warning: 75% Elapsed on {complaint.ticket_no}",
            badge_label="75% SLA WARNING",
            badge_bg="#f59e0b",
            ticket_no=complaint.ticket_no,
            summary_html=f"The allotted SLA window for this complaint has reached 75%. Please ensure repair milestones are active in the Caretaker Kanban board.",
            details=details,
            cta_url=ticket_link,
            cta_text="Review Ticket in Caretaker Kanban"
        )

        return cls._dispatch_and_log(
            db=db,
            template="sla_warning",
            to_emails=[assignee_email],
            cc_emails=[warden_email],
            subject=f"[CAMPUSIQ · WARNING] SLA 75% Approaching: {complaint.ticket_no} {complaint.title}",
            body_text=body_text.strip(),
            html_content=html_content
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
        ticket_link = f"{settings.FRONTEND_URL}/#ticket-{complaint.ticket_no}"
        cc_list = [warden_email]
        if assignee_email:
            cc_list.append(assignee_email)

        body_text = f"""Ref: {complaint.ticket_no} | Priority: {complaint.priority}
CRITICAL SLA BREACH NOTICE
The SLA deadline ({complaint.sla_deadline}) has expired without resolution.

Ticket: {complaint.title}
New Status: ESCALATED (+10 Risk Score applied)
Current Risk Score: {complaint.risk_score}/100

Immediate administrative intervention requested by the Chief Warden's office.

{OFFICIAL_SIGNATURE_TEXT.format(link=ticket_link)}
"""

        details = [
            {"label": "Breach Occurred", "value": str(complaint.sla_deadline)},
            {"label": "Escalated Status", "value": "ESCALATED (+10 Penalty Applied)"},
            {"label": "New Risk Score", "value": f"{complaint.risk_score} / 100"},
            {"label": "Hostel Hall", "value": complaint.location_text or "HB-3"},
        ]

        html_content = generate_branded_html_email(
            title=f"CRITICAL ESCALATION: {complaint.ticket_no} Breached SLA",
            badge_label="ESCALATED (100% BREACH)",
            badge_bg="#b91c1c",
            ticket_no=complaint.ticket_no,
            summary_html=f"This complaint breached its mandatory resolution deadline. The ticket has been escalated to the Chief Warden's office with an automated risk penalty.",
            details=details,
            cta_url=ticket_link,
            cta_text="Inspect in Chief Warden Command"
        )

        return cls._dispatch_and_log(
            db=db,
            template="escalated",
            to_emails=[chief_warden_email],
            cc_emails=cc_list,
            subject=f"[CAMPUSIQ · ESCALATION] SLA Breached (+10 Risk): {complaint.ticket_no} {complaint.title}",
            body_text=body_text.strip(),
            html_content=html_content
        )

    @classmethod
    def send_resolution_pending(
        cls,
        db: Session,
        complaint: Complaint,
        warden_email: str = "warden.hb3@campusiq.in"
    ) -> EmailLog:
        """Notification to Warden when caretaker marks RESOLVED for approval."""
        ticket_link = f"{settings.FRONTEND_URL}/#ticket-{complaint.ticket_no}"
        body_text = f"""Ref: {complaint.ticket_no}
The caretaker has marked this complaint as RESOLVED and submitted resolution evidence.

Completion Note: {complaint.resolution_note}
Verification Photo: {complaint.resolution_photo_url or 'Attached in portal'}

Please inspect and approve closure or reject back with remarks.

{OFFICIAL_SIGNATURE_TEXT.format(link=ticket_link)}
"""

        details = [
            {"label": "Ticket", "value": complaint.title},
            {"label": "Completion Note", "value": complaint.resolution_note or "Work finished"},
            {"label": "Evidence Photo", "value": complaint.resolution_photo_url or "Attached in portal"},
            {"label": "Action Needed", "value": "Inspect & Approve Closure"},
        ]

        html_content = generate_branded_html_email(
            title=f"Approval Needed: Resolution Completed for {complaint.ticket_no}",
            badge_label="RESOLVED (PENDING AUDIT)",
            badge_bg="#059669",
            ticket_no=complaint.ticket_no,
            summary_html=f"The caretaker has marked this complaint resolved with attached photographic evidence. Please verify and approve closure in the Warden Approvals tab.",
            details=details,
            cta_url=ticket_link,
            cta_text="Review & Approve in Warden Dashboard"
        )

        return cls._dispatch_and_log(
            db=db,
            template="resolution_pending",
            to_emails=[warden_email],
            cc_emails=[],
            subject=f"[CAMPUSIQ · APPROVAL NEEDED] Resolution Completed: {complaint.ticket_no} {complaint.title}",
            body_text=body_text.strip(),
            html_content=html_content
        )

    @classmethod
    def send_ticket_closed(
        cls,
        db: Session,
        complaint: Complaint,
        reporter_email: str = "student.hb3@campusiq.in",
        rep_email: Optional[str] = None
    ) -> EmailLog:
        """Notification to student when Warden approves closure."""
        ticket_link = f"{settings.FRONTEND_URL}/#ticket-{complaint.ticket_no}"
        cc_list = [rep_email] if rep_email else []
        body_text = f"""Ref: {complaint.ticket_no}
Your complaint "{complaint.title}" has been successfully resolved and approved by the Hall Warden.

Thank you for reporting facility issues and helping maintain campus living standards.

{OFFICIAL_SIGNATURE_TEXT.format(link=ticket_link)}
"""

        details = [
            {"label": "Ticket Title", "value": complaint.title},
            {"label": "Hostel / Room", "value": complaint.location_text or "Hostel"},
            {"label": "Resolution Note", "value": complaint.resolution_note or "Completed & verified"},
            {"label": "Final Status", "value": "CLOSED & AUDITED"},
        ]

        html_content = generate_branded_html_email(
            title=f"Complaint Closed: {complaint.title}",
            badge_label="OFFICIALLY CLOSED",
            badge_bg="#0284c7",
            ticket_no=complaint.ticket_no,
            summary_html=f"Great news! Your reported issue has been repaired by hall tradesmen and verified by the Hall Warden.",
            details=details,
            cta_url=ticket_link,
            cta_text="View in My Complaints Portal"
        )

        return cls._dispatch_and_log(
            db=db,
            template="closed",
            to_emails=[reporter_email],
            cc_emails=cc_list,
            subject=f"[CAMPUSIQ] Complaint Closed: {complaint.ticket_no} {complaint.title}",
            body_text=body_text.strip(),
            html_content=html_content
        )

    @classmethod
    def send_custom_email(
        cls,
        db: Session,
        to_emails: List[str],
        subject: str,
        message: str,
        template: str = "custom",
        cc_emails: Optional[List[str]] = None
    ) -> EmailLog:
        """Direct helper to dispatch arbitrary custom or test emails via Resend."""
        html_content = generate_branded_html_email(
            title=subject,
            badge_label="CAMPUSIQ NOTICE",
            badge_bg="#4f46e5",
            ticket_no="GENERAL",
            summary_html=f"<p>{message}</p>",
            details=[{"label": "Dispatched At", "value": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")}],
            cta_url=settings.FRONTEND_URL,
            cta_text="Visit CampusIQ Portal"
        )
        return cls._dispatch_and_log(
            db=db,
            template=template,
            to_emails=to_emails,
            cc_emails=cc_emails,
            subject=subject,
            body_text=message,
            html_content=html_content
        )
