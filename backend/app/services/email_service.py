import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
import logging

logger = logging.getLogger('bean_theory.email')

def send_password_reset_email(to_email, reset_url, user_name='Coffee Lover'):
    """
    Sends a password reset email using configured SMTP settings,
    or falls back to a clean development preview adapter.
    """
    app = current_app._get_current_object()
    mail_server = app.config.get('MAIL_SERVER')
    mail_port = app.config.get('MAIL_PORT', 587)
    mail_username = app.config.get('MAIL_USERNAME')
    mail_password = app.config.get('MAIL_PASSWORD')
    sender = app.config.get('MAIL_DEFAULT_SENDER', 'no-reply@beantheory.com.np')

    subject = "Reset Your Bean Theory Password"
    text_content = f"""Hello {user_name},

We received a request to reset your password for your Bean Theory account.

Please visit the link below to set a new password (valid for 1 hour):
{reset_url}

If you did not request a password reset, you can safely ignore this email. Your account remains secure.

Warm regards,
The Bean Theory Roastery Team
"""

    html_content = f"""<!DOCTYPE html>
<html>
<body style="font-family: 'DM Sans', -apple-system, sans-serif; background-color: #FAF7F2; padding: 24px; color: #2B1B17;">
  <div style="max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E8E2D8; padding: 32px; box-shadow: 0 4px 16px rgba(43,27,23,0.06);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="margin: 0; color: #2B1B17; font-family: Georgia, serif; letter-spacing: 1px;">Bean <span style="color: #B85D3A; font-weight: normal; font-size: 0.85em;">THEORY</span></h2>
    </div>
    <h3 style="color: #2B1B17; margin-top: 0;">Password Reset Request</h3>
    <p style="color: #635853; line-height: 1.6;">Hello {user_name},</p>
    <p style="color: #635853; line-height: 1.6;">We received a request to reset your password for your Bean Theory account. Click the button below to choose a new password:</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{reset_url}" style="display: inline-block; background-color: #B85D3A; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px;">Reset My Password</a>
    </div>
    <p style="color: #9C9189; font-size: 13px; line-height: 1.5;">This link is valid for 1 hour and can only be used once.<br>If the button above does not work, copy and paste this link into your browser:<br><a href="{reset_url}" style="color: #B85D3A; word-break: break-all;">{reset_url}</a></p>
    <hr style="border: none; border-top: 1px solid #F0ECE4; margin: 24px 0;">
    <p style="color: #9C9189; font-size: 12px; margin: 0;">If you did not request this change, please ignore this email. Your password will not be changed.</p>
  </div>
</body>
</html>
"""

    # Determine environment explicitly — never infer from deprecated or missing ENV
    is_production = (
        app.config.get('ENV_NAME') == 'production' or
        (not app.debug and not app.testing)
    )

    # If SMTP is properly configured
    if mail_server and mail_username and mail_password:
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = sender
            msg['To'] = to_email

            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(mail_server, mail_port, timeout=10) as server:
                if app.config.get('MAIL_USE_TLS', True):
                    server.starttls()
                server.login(mail_username, mail_password)
                server.sendmail(sender, [to_email], msg.as_string())

            logger.info("Password reset email successfully dispatched via SMTP")
            return True, "Email sent via SMTP"
        except Exception as e:
            if is_production:
                logger.error("Failed to deliver password reset email via SMTP (error masked in production)")
                return False, "Failed to deliver email"
            logger.error("Failed to send SMTP email to %s: %s", to_email, str(e))
            # In non-production, fall through to dev preview

    # In production, never fall through to development adapter or log reset URLs
    if is_production:
        logger.error("Email service not configured for production: SMTP credentials missing")
        return False, "Email service not configured for production"

    # Development Adapter: Log preview only in non-production environments
    if app.debug or app.testing or app.config.get('ENV_NAME') in ('development', 'testing'):
        logger.info("[DEV EMAIL ADAPTER] Password reset link preview generated for %s: %s", to_email, reset_url)
        return True, "Development email preview created"

    return False, "Email service not configured"
