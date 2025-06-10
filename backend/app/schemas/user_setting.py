from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserSettingBase(BaseModel):
  theme: str
  language: str

class UserSettingCreate(UserSettingBase):
  pass

class UserSettingUpdate(UserSettingBase):
  pass

class UserSetting(UserSettingBase):
  id: UUID
  created_at: datetime
  updated_at: Optional[datetime] = Field(default=None, nullable=True)

  class Config:
    from_attributes = True
    json_encoders = {
      datetime: lambda v: v.isoformat() if v else None
    }