from datetime import datetime
from pydantic import BaseModel, EmailStr
from uuid import UUID

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