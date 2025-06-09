from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserProfileBase(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfile(UserProfileBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = Field(default=None, nullable=True)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }