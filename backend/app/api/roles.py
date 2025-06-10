import logging
from datetime import datetime, UTC
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.connection import get_db
from app.schemas.role import Role, RoleCreate, RoleUpdate
from app.models.role import Role as RoleModel
from app.auth.utils import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/roles", response_model=list[Role])
async def get_roles(
  db: Session = Depends(get_db)
):
  try:
    roles = db.query(RoleModel).all()
    return roles
  except Exception as e:
    logger.error(f"Error: {str(e)}")
    raise HTTPException(status_code=400, detail=str(e))

@router.post("/roles", response_model=Role)
async def create_role(
  role_create: RoleCreate,
  _current_user = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  try:
    # ロールの作成
    role = RoleModel(
      name=role_create.name,
      description=role_create.description,
      created_at=datetime.now(UTC)
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=400, detail=str(e))

@router.put("/roles/{role_id}", response_model=Role)
async def update_role(
  role_id: UUID,
  role_update: RoleUpdate,
  _current_user = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  try:
    # ロールの取得
    role = db.query(RoleModel).filter(RoleModel.id == role_id).first()
    if not role:
      raise HTTPException(status_code=404, detail="Role not found")

    # ロールの更新
    for key, value in role_update.dict(exclude_unset=True).items():
      setattr(role, key, value)
    role.updated_at = datetime.now(UTC)

    db.commit()
    db.refresh(role)
    return role
  except Exception as e:
    db.rollback()
    raise HTTPException(status_code=400, detail=str(e))