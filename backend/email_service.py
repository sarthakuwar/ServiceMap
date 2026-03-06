import os
import logging

logger = logging.getLogger("email_service")

# ── Configuration ──────────────────────────────────────────────────
EMAIL_MODE = os.getenv("EMAIL_MODE", "live")  # "live" or "mock" — defaults to mock for safety
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "re_DsNLWEBg_HhaD4Ts5wCVEDMRpk5ci9ZxG")
FROM_ADDRESS = "ServiceMap <onboarding@resend.dev>"


def _send(to: list, subject: str, html: str) -> dict:
    """Core send function. Fire-and-forget. Never raises."""
    if EMAIL_MODE == "mock" or not RESEND_API_KEY:
        logger.info(f"📧 [MOCK EMAIL] To: {to}")
        logger.info(f"   Subject: {subject}")
        logger.info(f"   Body preview: {html[:300]}...")
        return {"mock": True, "to": to, "subject": subject}

    try:
        import resend
        resend.api_key = RESEND_API_KEY
        
        # sandbox intercept
        actual_to = ["partheshpurohit28@student.sfit.ac.in"]
        sandbox_subject = f"[To: {', '.join(to)}] {subject}"
        
        result = resend.Emails.send({
            "from": FROM_ADDRESS,
            "to": actual_to,
            "subject": sandbox_subject,
            "html": html,
        })
        logger.info(f"✅ Email sent to {to}: {subject}")
        return result
    except Exception as e:
        logger.error(f"❌ Email send failed: {e}")
        return {"error": str(e)}


# ── Email Templates ────────────────────────────────────────────────

def _wrap_html(title: str, body: str) -> str:
    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">🗺️ ServiceMap</h1>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1e293b; margin-top: 0;">{title}</h2>
            {body}
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">This is an automated notification from ServiceMap. Do not reply to this email.</p>
        </div>
    </div>
    """


def send_grievance_submitted(citizen_email: str, grievance: dict):
    """Sent when a citizen submits a new grievance."""
    body = f"""
    <p>Your grievance has been successfully submitted.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; color: #64748b;">Tracking #</td><td style="padding: 8px; font-weight: bold;">{grievance.get('tracking_number', 'N/A')}</td></tr>
        <tr><td style="padding: 8px; color: #64748b;">Title</td><td style="padding: 8px;">{grievance.get('title', '')}</td></tr>
        <tr><td style="padding: 8px; color: #64748b;">Category</td><td style="padding: 8px;">{grievance.get('category', '')}</td></tr>
        <tr><td style="padding: 8px; color: #64748b;">Status</td><td style="padding: 8px;"><span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 12px;">Pending Acknowledgement</span></td></tr>
    </table>
    <p>You will receive updates at this email address as your complaint is processed.</p>
    """
    _send([citizen_email], f"Grievance Submitted: {grievance.get('title', '')}", _wrap_html("Grievance Submitted", body))


def send_grievance_acknowledged(citizen_email: str, officer_email: str, grievance: dict):
    """Sent when an officer acknowledges a grievance."""
    citizen_body = f"""
    <p>Your grievance <strong>{grievance.get('tracking_number', '')}</strong> has been acknowledged by the assigned officer.</p>
    <p><strong>Officer:</strong> {grievance.get('assigned_officer', {}).get('name', 'Government Officer')}</p>
    <p>Expected resolution within the SLA timeline. You will be notified of any status changes.</p>
    """
    _send([citizen_email], f"Grievance Acknowledged: {grievance.get('tracking_number', '')}", _wrap_html("Grievance Acknowledged", citizen_body))

    if officer_email:
        officer_body = f"""
        <p>You have been assigned grievance <strong>{grievance.get('tracking_number', '')}</strong>.</p>
        <p><strong>Title:</strong> {grievance.get('title', '')}</p>
        <p><strong>Ward:</strong> {grievance.get('location', {}).get('ward_name', 'N/A')}</p>
        <p>Please review and take action within the SLA deadline.</p>
        """
        _send([officer_email], f"New Assignment: {grievance.get('tracking_number', '')}", _wrap_html("New Grievance Assignment", officer_body))


def send_status_update(citizen_email: str, followers: list, grievance: dict, new_status: str, notes: str = ""):
    """Sent when a grievance status changes."""
    body = f"""
    <p>Status update for grievance <strong>{grievance.get('tracking_number', '')}</strong>:</p>
    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <strong>New Status:</strong> {new_status.replace('_', ' ').title()}
        {f'<br /><strong>Notes:</strong> {notes}' if notes else ''}
    </div>
    <p><strong>Title:</strong> {grievance.get('title', '')}</p>
    """
    recipients = list(set([citizen_email] + (followers or [])))
    _send(recipients, f"Status Update: {grievance.get('tracking_number', '')}", _wrap_html("Grievance Status Update", body))


def send_escalation_alert(officer_email: str, supervisor_email: str, grievance: dict):
    """Sent when SLA breach triggers escalation."""
    body = f"""
    <p style="color: #dc2626;">⚠️ <strong>SLA Breach Alert</strong></p>
    <p>Grievance <strong>{grievance.get('tracking_number', '')}</strong> has breached its SLA deadline and has been escalated.</p>
    <p><strong>Title:</strong> {grievance.get('title', '')}</p>
    <p><strong>Ward:</strong> {grievance.get('location', {}).get('ward_name', 'N/A')}</p>
    <p>Immediate attention is required.</p>
    """
    recipients = list(set(filter(None, [officer_email, supervisor_email])))
    if recipients:
        _send(recipients, f"🚨 SLA Breach: {grievance.get('tracking_number', '')}", _wrap_html("SLA Escalation Alert", body))


def send_resolution_notification(citizen_email: str, followers: list, grievance: dict):
    """Sent when a grievance is resolved."""
    body = f"""
    <p>Great news! Your grievance <strong>{grievance.get('tracking_number', '')}</strong> has been resolved.</p>
    <p><strong>Title:</strong> {grievance.get('title', '')}</p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <span style="font-size: 24px;">✅</span>
        <p style="font-weight: bold; color: #16a34a; margin: 8px 0 0;">Resolved</p>
    </div>
    <p>If the issue persists, you can reopen this complaint through the ServiceMap platform.</p>
    """
    recipients = list(set([citizen_email] + (followers or [])))
    _send(recipients, f"Resolved: {grievance.get('tracking_number', '')}", _wrap_html("Grievance Resolved", body))


def send_follow_confirmation(follower_email: str, item_type: str, item_name: str):
    """Sent when a user follows an issue or ward."""
    body = f"""
    <p>You are now following <strong>{item_name}</strong>.</p>
    <p>You will receive email notifications whenever there are updates to this {item_type}.</p>
    <p style="color: #64748b; font-size: 13px;">To unfollow, visit the {item_type} page on ServiceMap.</p>
    """
    _send([follower_email], f"Following: {item_name}", _wrap_html(f"Now Following {item_type.title()}", body))


def send_government_update(target_emails: list, update_message: str, officer_name: str, ward_name: str = ""):
    """Sent as a broadcast update from government."""
    body = f"""
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0; font-weight: bold; color: #1e40af;">📢 Government Update{f' — {ward_name}' if ward_name else ''}</p>
    </div>
    <p>{update_message}</p>
    <p style="color: #64748b; font-size: 13px;"><em>— {officer_name}</em></p>
    """
    if target_emails:
        _send(target_emails, f"Government Update: {ward_name or 'ServiceMap'}", _wrap_html("Government Update", body))
