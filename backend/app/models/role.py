from sqlalchemy import Column, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base

class Role(Base):
  __tablename__ = "roles"
  id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  name = Column(Text)
  description = Column(Text)