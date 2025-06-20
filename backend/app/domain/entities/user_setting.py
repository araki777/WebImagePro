from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Optional
from uuid import UUID


@dataclass
class UserSetting:
    """ユーザー設定エンティティ"""

    id: UUID
    theme: str
    language: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    def update_theme(self, new_theme: str) -> None:
        """テーマ更新のビジネスロジック"""
        valid_themes = ["light", "dark", "auto"]
        if new_theme not in valid_themes:
            raise ValueError(f"Invalid theme: {new_theme}")

        if new_theme == self.theme:
            raise ValueError("Theme is already set")

        self.theme = new_theme
        self.updated_at = datetime.now(UTC)

    def update_language(self, new_language: str) -> None:
        """言語更新のビジネスロジック"""
        valid_languages = ["ja", "en"]
        if new_language not in valid_languages:
            raise ValueError(f"Invalid language: {new_language}")

        if new_language == self.language:
            raise ValueError("Language is already set")

        self.language = new_language
        self.updated_at = datetime.now(UTC)

    def update_settings(
        self, theme: Optional[str] = None, language: Optional[str] = None
    ) -> None:
        """設定一括更新のドメインロジック"""
        if theme is not None:
            self.update_theme(theme)
        if language is not None:
            self.update_language(language)

    def is_dark_theme(self) -> bool:
        """ダークテーマかどうかの判断"""
        return self.theme == "dark"

    def is_japanese(self) -> bool:
        """日本語設定かどうかの判定"""
        return self.language == "ja"

    @classmethod
    def create_new(
        cls, user_id: UUID, theme: str = "light", language: str = "ja"
    ) -> "UserSetting":
        """新しい設定を作成するファクトリメソッド"""
        return cls(
            id=user_id,
            theme=theme,
            language=language,
            created_at=datetime.now(UTC),
        )

    @classmethod
    def create_default_setting(cls, user_id: UUID) -> "UserSetting":
        """デフォルト設定を作成するファクトリメソッド"""
        return cls.create_new(user_id, theme="light", language="ja")
