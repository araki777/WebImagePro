from sqlalchemy import Column, DateTime, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base

class UserSetting(Base):
  __tablename__ = "user_settings"
  id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), primary_key=True)
  theme = Column(String)
  language = Column(String)
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  updated_at = Column(DateTime(timezone=True))
  user = relationship("User")