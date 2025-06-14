import uuid
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.schemas.role import Role as RoleModel
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
        for key, value in role_update.dict(exclude_unset=True).items():
            setattr(role, key, value)
        role.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(role)
        return role
