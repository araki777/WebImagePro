from typing import Optional
from uuid import UUID

from app.domain.entities.user_setting import UserSetting
from app.domain.repositories.user_setting_repository import UserSettingRepository


class UserSettingApplicationService:
    """ユーザー設定アプリケーションサービス"""

    def __init__(self, user_setting_repository: UserSettingRepository):
        self.user_setting_repository = user_setting_repository

    async def get_or_create_user_setting(self, user_id: UUID) -> UserSetting:
        """ユーザー設定取得または作成のユースケース"""
        user_setting = await self.user_setting_repository.find_by_id(user_id)

        if not user_setting:
            user_setting = UserSetting.create_default_setting(user_id)
            user_setting = await self.user_setting_repository.save(user_setting)

        return user_setting

    async def update_user_setting(
        self, user_id: UUID, new_theme: Optional[str], new_language: Optional[str]
    ) -> UserSetting:
        """ユーザー設定のユースケース"""
        user_setting = await self.user_setting_repository.find_by_id(user_id)

        if not user_setting:
            raise ValueError("User setting not found")

        # ドメインロジックを実行
        user_setting.update_settings(new_theme, new_language)

        return await self.user_setting_repository.save(user_setting)

    async def update_theme(self, user_id: UUID, new_theme: str) -> UserSetting:
        """テーマ更新のユースケース"""
        user_setting = await self.user_setting_repository.find_by_id(user_id)

        if not user_setting:
            raise ValueError("User setting not found")

        user_setting.update_theme(new_theme)
        return await self.user_setting_repository.save(user_setting)

    async def update_language(self, user_id: UUID, new_language: str) -> UserSetting:
        """言語更新のユースケース"""
        user_setting = await self.user_setting_repository.find_by_id(user_id)

        if not user_setting:
            raise ValueError("User setting not found")

        user_setting.update_language(new_language)
        return await self.user_setting_repository.save(user_setting)

    async def get_users_by_theme(self, theme: str) -> list[UserSetting]:
        """指定されたテーマを使用するユーザー一覧を取得"""
        return await self.user_setting_repository.find_by_theme(theme)

    async def get_users_by_language(self, language: str) -> list[UserSetting]:
        """指定された言語を使用するユーザー一覧を取得"""
        return await self.user_setting_repository.find_by_language(language)
