from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


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
    updated_at: Optional[datetime] = Field(default=None)

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}
