from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.user_role import UserRole
from app.domain.repositories.user_role_repository import UserRoleRepository
from app.models.user_role import UserRole as UserRoleModel


class SQLAlchemyUserRoleRepository(UserRoleRepository):
    """SQLAlchemyを使用したユーザーロールリポジトリの実装"""

    def __init__(self, db_session: Session):
        self.db = db_session

    async def save(self, user_role: UserRole) -> UserRole:
        """ユーザーロールを保存"""
        db_model = self.db.query(UserRoleModel).filter_by(id=user_role.id).first()

        if db_model:
            # 更新
            db_model.role_id = user_role.role_id
            db_model.updated_at = user_role.updated_at
        else:
            # 新規作成
            db_model = UserRoleModel(
                id=user_role.id,
                role_id=user_role.role_id,
                created_at=user_role.created_at,
                updated_at=user_role.updated_at,
            )
            self.db.add(db_model)

        self.db.commit()
        self.db.refresh(db_model)

        # DBモデルをドメインエンティティに変換して返す
        return self._to_domain_entity(db_model)

    async def find_by_user_id(self, user_id: UUID) -> Optional[UserRole]:
        """ユーザーIDでユーザーロールを検索"""
        db_model = self.db.query(UserRoleModel).filter_by(id=user_id).first()
        return self._to_domain_entity(db_model) if db_model else None

    async def exists(self, user_id: UUID) -> bool:
        """ユーザーロールの存在確認"""
        return self.db.query(UserRoleModel).filter_by(id=user_id).first() is not None

    async def find_by_role_id(self, role_id: UUID) -> list[UserRole]:
        """ロールIDでユーザーロールを検索"""
        db_models = self.db.query(UserRoleModel).filter_by(role_id=role_id).all()
        return [self._to_domain_entity(db_model) for db_model in db_models]

    def _to_domain_entity(self, db_model: UserRoleModel) -> UserRole:
        """DBモデルをドメインエンティティに変換"""
        return UserRole(
            id=db_model.id,
            role_id=db_model.role_id,
            created_at=db_model.created_at,
            updated_at=db_model.updated_at,
        )
