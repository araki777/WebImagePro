import logging, os
from datetime import datetime, UTC
from uuid import UUID

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import resend

from app.connection import get_db
from app.schemas.contact import Contact, ContactCreate, ContactUpdate
from app.models.contact import Contact as ContactModel
from app.auth.utils import get_current_user
from app.utils.email_templates import generate_contact_email_html

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=list[Contact])
async def get_current_user_contacts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        contacts = db.query(ContactModel).filter(
            ContactModel.user_id == current_user.user.id
        ).all()
        return contacts
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/", response_model=Contact)
async def create_contact(
    contact_create: ContactCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # 問い合わせの作成
        contact = ContactModel(
            user_id=current_user.user.id,
            name=contact_create.name,
            email=contact_create.email,
            message=contact_create.message,
            subject=contact_create.subject,
            created_at=datetime.now(UTC)
        )
        db.add(contact)
        db.commit()
        db.refresh(contact)

        # メール送信
        try:
            # 管理者向けメール
            params: resend.Emails.SendParams = {
                "from": os.getenv("RESEND_EMAIL_FROM"),
                "to": [os.getenv("RESEND_EMAIL_TO")],
                "subject": "お問い合わせが届きました",
                "html": generate_contact_email_html(contact)
            }
            resend.Emails.send(params)

            # ユーザー向けメール
            params: resend.Emails.SendParams = {
                "from": os.getenv("RESEND_EMAIL_FROM"),
                "to": [contact.email],
                "subject": "お問い合わせありがとうございます",
                "html": generate_contact_email_html(contact)
            }
            resend.Emails.send(params)
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            raise HTTPException(status_code=500, detail="メール送信に失敗しました")

        return contact

    except Exception as e:
        db.rollback()
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
