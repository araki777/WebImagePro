from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user_setting import UserSetting as UserSettingModel
from app.schemas.user_setting import UserSettingCreate, UserSettingUpdate


class UserSettingService:
    def __init__(self, db: Session):
        self.db = db

    def check_user_setting_exists(self, user_id: UUID):
        """ユーザー設定が存在するか確認"""
        return self.db.query(UserSettingModel).filter_by(id=user_id).first() is not None

    def get_user_setting(self, user_id: UUID):
        """ユーザー設定を取得"""
        return self.db.query(UserSettingModel).filter_by(id=user_id).first()

    def create_user_setting(
        self, user_id: UUID, user_setting_create: UserSettingCreate
    ):
        """ユーザー設定を作成"""
        user_setting = UserSettingModel(
            id=user_id,
            created_at=datetime.now(UTC),
            **user_setting_create.model_dump(exclude_unset=True),
        )
        self.db.add(user_setting)
        self.db.commit()
        self.db.refresh(user_setting)
        return user_setting

    def update_user_setting(
        self, user_id: UUID, user_setting_update: UserSettingUpdate
    ):
        """ユーザー設定を更新"""
        user_setting = self.get_user_setting(user_id)
        for key, value in user_setting_update.model_dump(exclude_unset=True).items():
            setattr(user_setting, key, value)
        user_setting.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(user_setting)
        return user_setting
