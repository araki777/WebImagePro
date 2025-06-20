from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Optional
from uuid import UUID


@dataclass
class UserProfile:
    """ユーザープロファイルエンティティ"""

    id: UUID
    display_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime] = None

    def update_profile(
        self, display_name: Optional[str], bio: Optional[str], avatar_url: Optional[str]
    ) -> None:
        """プロフィール更新のドメインロジック"""
        if display_name is not None:
            if len(display_name.strip()) == 0:
                raise ValueError("Display name cannot be empty")
            self.display_name = display_name.strip()

        if bio is not None:
            if len(bio) > 500:
                raise ValueError("Bio cannot be longer than 500 characters")

        if avatar_url is not None:
            if not self._is_valid_url(avatar_url):
                raise ValueError("Invalid avatar URL")
            self.avatar_url = avatar_url

        self.updated_at = datetime.now(UTC)

    def is_complete(self) -> bool:
        """プロフィールが完全かどうかのビジネスルール"""
        return self.display_name is not None and len(self.display_name.strip()) > 0

    def _is_valid_url(self, url: str) -> bool:
        """URLの妥当性チェック"""
        return url.startswith(("http://", "https://"))

    @classmethod
    def create_new(cls, user_id: UUID) -> "UserProfile":
        """新しいプロフィールを作成するファクトリメソッド"""
        return cls(
            id=user_id,
            display_name=None,
            bio=None,
            avatar_url=None,
            created_at=datetime.now(UTC),
        )
