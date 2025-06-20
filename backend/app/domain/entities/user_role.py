from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Optional
from uuid import UUID


@dataclass
class UserRole:
    """ユーザーロールエンティティ"""

    id: UUID
    role_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    def update_role(self, new_role_id: UUID) -> None:
        """ロール更新のドメインロジック"""
        if new_role_id == self.role_id:
            raise ValueError("Role ID is already set")

        self.role_id = new_role_id
        self.updated_at = datetime.now(UTC)

    def is_active(self) -> bool:
        """ロールがアクティブかどうかのビジネスルール"""
        return True

    def has_role(self, role_id: UUID) -> bool:
        """指定されたロールを持っているかをチェック"""
        return self.role_id == role_id

    @classmethod
    def create_new(cls, user_id: UUID, role_id: UUID) -> "UserRole":
        """新しいユーザーロールを作成するファクトリメソッド"""
        return cls(
            id=user_id,
            role_id=role_id,
            created_at=datetime.now(UTC),
        )

    @classmethod
    def create_default_user_role(
        cls, user_id: UUID, default_role_id: UUID
    ) -> "UserRole":
        """デフォルトユーザーロールを作成するファクトリメソッド"""
        return cls.create_new(user_id, default_role_id)
