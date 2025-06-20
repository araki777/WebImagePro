from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.domain.entities.user_setting import UserSetting
from app.domain.repositories.user_setting_repository import UserSettingRepository
from app.models.user_setting import UserSetting as UserSettingModel


class SQLAlchemyUserSettingRepository(UserSettingRepository):
    """SQLAlchemyを使用したユーザー設定リポジトリの実装"""

    def __init__(self, db_session: Session):
        self.db = db_session

    async def save(self, user_setting: UserSetting) -> UserSetting:
        """ユーザー設定を保存"""

        db_model = self.db.query(UserSettingModel).filter_by(id=user_setting.id).first()

        if db_model:
            # 更新
            db_model.theme = user_setting.theme
            db_model.language = user_setting.language
            db_model.updated_at = user_setting.updated_at
        else:
            db_model = UserSettingModel(
                id=user_setting.id,
                theme=user_setting.theme,
                language=user_setting.language,
                created_at=user_setting.created_at,
                updated_at=user_setting.updated_at,
            )
            self.db.add(db_model)

        self.db.commit()
        self.db.refresh(db_model)

        # DBモデルをドメインエンティティに変換して返す
        return self._to_domain_entity(db_model)

    async def find_by_id(self, user_id: UUID) -> Optional[UserSetting]:
        """ユーザーIDでユーザー設定を検索"""
        db_model = self.db.query(UserSettingModel).filter_by(id=user_id).first()
        return self._to_domain_entity(db_model) if db_model else None

    async def exists(self, user_id: UUID) -> bool:
        """ユーザー設定の存在確認"""
        return self.db.query(UserSettingModel).filter_by(id=user_id).first() is not None

    async def find_by_theme(self, theme: str) -> list[UserSetting]:
        """テーマでユーザー設定一覧を検索"""
        db_models = self.db.query(UserSettingModel).filter_by(theme=theme).all()
        return [self._to_domain_entity(db_model) for db_model in db_models]

    async def find_by_language(self, language: str) -> list[UserSetting]:
        """言語でユーザー設定一覧を検索"""
        db_models = self.db.query(UserSettingModel).filter_by(language=language).all()
        return [self._to_domain_entity(db_model) for db_model in db_models]

    def _to_domain_entity(self, db_model: UserSettingModel) -> UserSetting:
        """DBモデルをドメインエンティティに変換"""
        return UserSetting(
            id=db_model.id,
            theme=db_model.theme,
            language=db_model.language,
            created_at=db_model.created_at,
            updated_at=db_model.updated_at,
        )
