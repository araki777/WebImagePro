from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base

class UserRole(Base):
  __tablename__ = "user_roles"
  id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), primary_key=True)
  role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"))
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  updated_at = Column(DateTime(timezone=True))
  user = relationship("User")