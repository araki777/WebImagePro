from sqlalchemy import UUID, Column, String
from sqlalchemy.orm import relationship

from app.models.base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "auth"}

    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(String, unique=True, nullable=False)

    # UserProfileとのリレーションシップを定義
    profile = relationship("UserProfile", back_populates="user", uselist=False)
