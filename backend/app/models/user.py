from sqlalchemy import Column, UUID

from app.models.base import Base


class User(Base):
  __tablename__ = "users"
  __table_args__ = {"schema": "auth"}

  id = Column(UUID(as_uuid=True), primary_key=True)