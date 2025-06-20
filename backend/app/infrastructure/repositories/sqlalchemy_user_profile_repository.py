from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.user_profile import UserProfile
from app.domain.repositories.user_profile_repository import UserProfileRepository
from app.models.user_profile import UserProfile as UserProfileModel


class SQLAlchemyUserProfileRepository(UserProfileRepository):
    """SQLAlchemyを使用したユーザープロファイルリポジトリの実装"""

    def __init__(self, db_session: Session):
        self.db = db_session

    async def save(self, user_profile: UserProfile) -> UserProfile:
        """プロフィールを保存"""

        # ドメインエンティティをDBモデルに変換
        db_model = self.db.query(UserProfileModel).filter_by(id=user_profile.id).first()

        if db_model:
            # 更新
            db_model.display_name = user_profile.display_name
            db_model.bio = user_profile.bio
            db_model.avatar_url = user_profile.avatar_url
            db_model.updated_at = user_profile.updated_at
        else:
            # 新規作成
            db_model = UserProfileModel(
                id=user_profile.id,
                display_name=user_profile.display_name,
                bio=user_profile.bio,
                avatar_url=user_profile.avatar_url,
                created_at=user_profile.created_at,
                updated_at=user_profile.updated_at,
            )
            self.db.add(db_model)

        self.db.commit()
        self.db.refresh(db_model)

        # DBモデルをドメインエンティティに変換して返す
        return self._to_domain_entity(db_model)

    async def find_by_id(self, user_id: UUID) -> Optional[UserProfile]:
        """ユーザーIDでプロフィールを検索"""
        db_model = self.db.query(UserProfileModel).filter_by(id=user_id).first()
        return self._to_domain_entity(db_model) if db_model else None

    async def exists(self, user_id: UUID) -> bool:
        """プロフィールの存在確認"""
        return self.db.query(UserProfileModel).filter_by(id=user_id).first() is not None

    def _to_domain_entity(self, db_model: UserProfileModel) -> UserProfile:
        """DBモデルをドメインエンティティに変換"""
        return UserProfile(
            id=db_model.id,
            display_name=db_model.display_name,
            bio=db_model.bio,
            avatar_url=db_model.avatar_url,
            created_at=db_model.created_at,
            updated_at=db_model.updated_at,
        )
