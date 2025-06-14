from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    pass


class RoleUpdate(RoleBase):
    pass


class Role(RoleBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = Field(default=None, nullable=True)
