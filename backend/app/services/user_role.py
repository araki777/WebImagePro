from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user_role import UserRole as UserRoleModel
from app.schemas.user_role import UserRoleCreate, UserRoleUpdate
from app.services.role import RoleService


class UserRoleService:
    def __init__(self, db: Session):
        self.db = db

    def check_user_role_exists(self, user_id: UUID):
        """ユーザーロールが存在するか確認"""
        return self.db.query(UserRoleModel).filter_by(id=user_id).first()

    def get_or_create_user_role(self, user_id: UUID):
        """ユーザーロールを取得または作成"""
        user_role = self.check_user_role_exists(user_id)
        if user_role:
            return user_role

        role_service = RoleService(self.db)

        role = role_service.get_role_by_name("User")

        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found",
            )

        user_role_create = UserRoleCreate(
            role_id=role.id,
        )

        return self.create_user_role(user_id, user_role_create)

    def create_user_role(self, user_id: UUID, user_role_create: UserRoleCreate):
        """ユーザーロールを作成"""
        user_role = UserRoleModel(
            id=user_id,
            created_at=datetime.now(UTC),
            **user_role_create.model_dump(exclude_unset=True),
        )
        self.db.add(user_role)
        self.db.commit()
        self.db.refresh(user_role)
        return user_role

    def update_user_role(self, user_id: UUID, user_role_update: UserRoleUpdate):
        """ユーザーロールを更新"""
        user_role = self.check_user_role_exists(user_id)
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User role not found",
            )
        for key, value in user_role_update.model_dump(exclude_unset=True).items():
            setattr(user_role, key, value)
        user_role.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(user_role)
        return user_role
