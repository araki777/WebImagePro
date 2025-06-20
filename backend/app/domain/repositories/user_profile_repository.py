from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.domain.entities.user_profile import UserProfile


class UserProfileRepository(ABC):
    """ユーザープロファイルリポジトリのインターフェース"""

    @abstractmethod
    async def save(self, user_profile: UserProfile) -> UserProfile:
        """プロフィールを保存"""
        pass

    @abstractmethod
    async def find_by_id(self, user_id: UUID) -> Optional[UserProfile]:
        """ユーザーIDでプロフィールを検索"""
        pass

    @abstractmethod
    async def exists(self, user_id: UUID) -> bool:
        """プロフィールの存在確認"""
        pass
