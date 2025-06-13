import resend
from dotenv import load_dotenv

from app.core.config import settings
from app.models.contact import Contact as ContactModel
from app.utils.email_templates import generate_contact_email_html

load_dotenv()

resend.api_key = settings.RESEND_API_KEY


class EmailService:
    def __init__(self):
        self.from_email = settings.RESEND_EMAIL_FROM
        self.admin_email = settings.RESEND_EMAIL_TO

    def send_contact_emails(self, contact: ContactModel) -> None:
        """問い合わせに関するメールを送信"""
        # 管理者向けメール
        admin_params: resend.Emails.SendParams = {
            "from": self.from_email,
            "to": [self.admin_email],
            "subject": "お問い合わせが届きました",
            "html": generate_contact_email_html(contact),
        }
        resend.Emails.send(admin_params)

        # ユーザー向けメール
        user_params: resend.Emails.SendParams = {
            "from": self.from_email,
            "to": [str(contact.email)],
            "subject": "お問い合わせありがとうございます",
            "html": generate_contact_email_html(contact),
        }
        resend.Emails.send(user_params)
