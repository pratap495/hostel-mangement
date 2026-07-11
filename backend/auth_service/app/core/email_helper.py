import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from .config import settings

logger = logging.getLogger(__name__)

def send_otp_email(to_email: str, otp_code: str, purpose: str = "password reset") -> bool:
    """Send an OTP code to a recipient email. Logs OTP to console for local development fallback."""
    subject = f"HostelMint - OTP for {purpose.title()}"
    body = f"""
    <html>
        <body>
            <h3>HostelMint Verification Alert</h3>
            <p>You requested an OTP for <strong>{purpose}</strong> on your HostelMint account.</p>
            <p style="font-size: 16pt; font-weight: bold; letter-spacing: 2px; color: #00acc1;">{otp_code}</p>
            <p>This code is valid for <strong>5 minutes</strong>. If you did not make this request, please secure your account.</p>
        </body>
    </html>
    """
    
    # Always log the OTP to stdout/console so that developers can test locally without configuring SMTP
    logger.info(f"\n[DEVELOPMENT MAIL LOG] To: {to_email} | Purpose: {purpose} | OTP: {otp_code}\n")
    
    # If SMTP is not fully configured, bypass actual SMTP dispatch gracefully
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.info("SMTP credentials not fully configured. Bypassing email dispatch.")
        return True
        
    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        
        msg.attach(MIMEText(body, "html"))
        
        # Connect to SMTP server
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        
        logger.info(f"OTP successfully emailed to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to dispatch OTP email: {e}")
        return False
