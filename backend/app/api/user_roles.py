import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.utils import get_current_user
from app.connection import get_db
from app.models.role import Role
from app.models.user_role import UserRole as UserRoleModel
from app.schemas.user_role import UserRole, UserRoleUpdate

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/me/role", response_model=UserRole)
async def get_current_user_role(
    current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        # ユーザーIDを使用してロールを取得
        role = (
            db.query(UserRoleModel)
            .filter(UserRoleModel.id == current_user.user.id)
            .first()
        )

        if not role:
            raise HTTPException(status_code=404, detail="Role not found")

        return role
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/me/role", response_model=UserRole)
async def update_current_user_role(
    role_update: UserRoleUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        # ユーザーIDを使用してロールを取得
        role = (
            db.query(UserRoleModel)
            .filter(UserRoleModel.id == current_user.user.id)
            .first()
        )

        if not role:
            # Userロールをroleテーブルから取得
            user_role = db.query(Role).filter(Role.name == "User").first()
            if not user_role:
                # 無ければ作成
                user_role = Role(name="User")
                db.add(user_role)
                db.commit()
                db.refresh(user_role)

            # UserRoleModelを新規作成
            role = UserRoleModel(
                id=current_user.user.id,
                role_id=user_role.id,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC),
                **role_update.dict(exclude_unset=True),
            )
            db.add(role)
        else:
            # 既存のロールを更新
            for key, value in role_update.dict(exclude_unset=True).items():
                setattr(role, key, value)
            role.updated_at = datetime.now(UTC)

        db.commit()
        db.refresh(role)
        return role
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
