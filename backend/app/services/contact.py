from datetime import UTC, datetime
from typing import List

from sqlalchemy.orm import Session

from app.models.contact import Contact as ContactModel
from app.schemas.contact import Contact, ContactCreate
from app.services.email import EmailService


class ContactService:
    def __init__(self, db: Session):
        self.db = db
        self.email_service = EmailService()

    def get_contacts(self, user_id: int) -> List[Contact]:
        """ユーザーの問い合わせ一覧を取得"""
        contacts = (
            self.db.query(ContactModel).filter(ContactModel.user_id == user_id).all()
        )
        return [Contact.model_validate(contact) for contact in contacts]

    def create_contact(self, contact_create: ContactCreate, user_id: int) -> Contact:
        """新しい問い合わせを作成"""
        contact = ContactModel(
            user_id=user_id,
            name=contact_create.name,
            email=contact_create.email,
            message=contact_create.message,
            subject=contact_create.subject,
            created_at=datetime.now(UTC),
        )
        self.db.add(contact)
        self.db.commit()
        self.db.refresh(contact)

        # メール送信
        self.email_service.send_contact_emails(contact)

        return Contact.model_validate(contact)
