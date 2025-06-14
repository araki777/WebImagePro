from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class ContactBase(BaseModel):
    name: str
    email: EmailStr
    message: str
    subject: str


class ContactCreate(ContactBase):
    pass


class ContactUpdate(ContactBase):
    pass


class Contact(ContactBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
