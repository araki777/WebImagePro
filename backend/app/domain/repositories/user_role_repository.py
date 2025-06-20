from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.domain.entities.user_role import UserRole


class UserRoleRepository(ABC):
    """ユーザーロールリポジトリのインターフェース"""

    @abstractmethod
    async def save(self, user_role: UserRole) -> UserRole:
        """ユーザーロールを保存"""
        pass

    @abstractmethod
    async def find_by_user_id(self, user_id: UUID) -> Optional[UserRole]:
        """ユーザーIDでユーザーロールを編集"""
        pass

    @abstractmethod
    async def exists(self, user_id: UUID) -> bool:
        """ロールIDでユーザーロール一覧を検索"""
        pass

    @abstractmethod
    async def find_by_role_id(self, role_id: UUID) -> list[UserRole]:
        """ロールIDでユーザーロール一覧を検索"""
        pass
