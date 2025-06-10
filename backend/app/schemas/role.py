from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

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