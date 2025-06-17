import uuid
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.role import Role as RoleModel
from app.models.user_role import UserRole
from app.schemas.role import RoleCreate, RoleUpdate


class RoleService:
    def __init__(self, db: Session):
        self.db = db

    def check_role_exists(self, role_id: UUID):
        """ロールが存在するか確認"""
        return self.db.query(RoleModel).filter_by(id=role_id).first() is not None

    def get_role(self, role_id: UUID):
        """ロールを取得"""
        role = self.db.query(RoleModel).filter_by(id=role_id).first()
        if role is None:
            raise ValueError("Role not found")
        return role

    def get_roles(self):
        """ロールを取得"""
        roles = self.db.query(RoleModel).all()
        return roles
    
    def get_role_by_name(self, name: str):
        """ロールを名前で取得"""
        role = self.db.query(RoleModel).filter_by(name=name).first()
        if role is None:
            raise ValueError("Role not found")
        return role

    def create_role(self, role_create: RoleCreate):
        """ロールを作成"""
        role = RoleModel(
            id=uuid.uuid4(),
            name=role_create.name,
            description=role_create.description,
            created_at=datetime.now(UTC),
        )
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        return role

    def update_role(self, role_id: UUID, role_update: RoleUpdate):
        """ロールを更新"""
        role = self.get_role(role_id)

        # 更新可能なフィールドのみ更新
        for key, value in role_update.model_dump(exclude_unset=True).items():
            setattr(role, key, value)
        role.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(role)
        return role

    def delete_role(self, role_id: UUID):
        """ロールを削除"""
        role = self.get_role(role_id)

        # ロールが存在しない場合
        if role is None:
            raise ValueError("Role not found")

        # user_roleテーブルで使用されているかチェック
        user_roles = self.db.query(UserRole).filter(UserRole.role_id == role_id).first()
        if user_roles is not None:
            raise ValueError("Cannot delete role that is assigned to users")

        # ロールを削除
        self.db.delete(role)
        self.db.commit()
        return role