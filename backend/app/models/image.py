from sqlalchemy import Column, Text, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base

class Image(Base):
  __tablename__ = "images"
  id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
  file_name = Column(Text)
  blob_name = Column(Text)
  container_name = Column(Text)
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  ja_tags = Column(ARRAY(Text))
  en_tags = Column(ARRAY(Text))