from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user_setting import UserSetting as UserSettingModel
from app.schemas.user_setting import UserSettingCreate, UserSettingUpdate


class UserSettingService:
    def __init__(self, db: Session):
        self.db = db

    def check_user_setting_exists(self, user_id: UUID):
        """ユーザー設定が存在するか確認"""
        return self.db.query(UserSettingModel).filter_by(id=user_id).first()

    def get_or_create_user_setting(self, user_id: UUID):
        """ユーザー設定を取得または作成"""
        user_setting = self.check_user_setting_exists(user_id)
        if user_setting:
            return user_setting

        user_setting_create = UserSettingCreate(
            theme="light",
            language="ja",
        )

        return self.create_user_setting(user_id, user_setting_create)

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
        user_setting = self.check_user_setting_exists(user_id)
        if not user_setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User setting not found",
            )
        for key, value in user_setting_update.model_dump(exclude_unset=True).items():
            setattr(user_setting, key, value)
        user_setting.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(user_setting)
        return user_setting
