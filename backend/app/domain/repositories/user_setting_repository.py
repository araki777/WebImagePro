from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.domain.entities.user_setting import UserSetting


class UserSettingRepository(ABC):
    """ユーザー設定リポジトリのインターフェース"""

    @abstractmethod
    async def save(self, user_setting: UserSetting) -> UserSetting:
        """設定を保存"""
        pass

    @abstractmethod
    async def find_by_id(self, user_id: UUID) -> Optional[UserSetting]:
        """ユーザーIDで設定を検索"""
        pass

    @abstractmethod
    async def exists(self, user_id: UUID) -> bool:
        """設定の存在確認"""
        pass

    @abstractmethod
    async def find_by_theme(self, theme: str) -> list[UserSetting]:
        """テーマでユーザー設定一覧を検索"""
        pass

    @abstractmethod
    async def find_by_language(self, language: str) -> list[UserSetting]:
        """言語でユーザー設定一覧を検索"""
        pass
