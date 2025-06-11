from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UserRoleBase(BaseModel):
    role_id: UUID


class UserRoleCreate(UserRoleBase):
    pass


class UserRoleUpdate(UserRoleBase):
    pass


class UserRole(UserRoleBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = Field(default=None, nullable=True)

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}
