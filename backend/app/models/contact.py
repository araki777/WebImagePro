import uuid

from sqlalchemy import Column, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func, text

from app.models.base import Base

class Contact(Base):
  __tablename__ = "contacts"
  id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"))
  name = Column(Text)
  email = Column(Text)
  subject = Column(Text)
  message = Column(Text)
  user = relationship("User")