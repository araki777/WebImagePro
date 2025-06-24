"""
メイン設定クラス
"""

from dataclasses import dataclass
from typing import Optional

from dotenv import load_dotenv

from .azure import AzureSettings
from .database import DatabaseSettings
from .email import EmailSettings
from .supabase import SupabaseSettings
from .utils import get_env, validate_url

load_dotenv(".env")


@dataclass
class Settings:
    """
    環境変数設定クラス
    """

    # 基本設定
    environment: str
    frontend_url: str
    log_level: str

    # 各サービス設定
    database: DatabaseSettings
    azure: AzureSettings
    supabase: SupabaseSettings
    email: EmailSettings

    # シングルトンインスタンス（クラス変数）
    _instance: Optional["Settings"] = None

    @classmethod
    def from_env(cls) -> "Settings":
        """環境変数からSettingsインスタンスを作成"""
        if cls._instance is None:
            cls._instance = cls._create_instance()
        return cls._instance

    @classmethod
    def _create_instance(cls) -> "Settings":
        """実際のインスタンス生成"""
        instance = cls(
            environment=get_env("ENVIRONMENT", "development"),
            frontend_url=validate_url(get_env("FRONTEND_URL"), "FRONTEND_URL"),
            log_level=get_env("LOG_LEVEL", "INFO"),
            database=DatabaseSettings.from_env(),
            azure=AzureSettings.from_env(),
            supabase=SupabaseSettings.from_env(),
            email=EmailSettings.from_env(),
        )
        instance.validate()
        return instance

    @classmethod
    def reset_instance(cls) -> None:
        """インスタンスをリセット（テスト用）"""
        cls._instance = None

    @property
    def is_development(self) -> bool:
        """開発環境かどうかを判定"""
        return self.environment.lower() in ("development", "dev", "local")

    @property
    def is_production(self) -> bool:
        """本番環境かどうかを判定"""
        return self.environment.lower() in ("production", "prod")

    @property
    def is_testing(self) -> bool:
        """テスト環境かどうかを判定"""
        return self.environment.lower() in ("testing", "test")

    def validate(self) -> None:
        """設定の妥当性を検証"""
        if not self.is_development and not self.is_production and not self.is_testing:
            raise ValueError(f"無効な環境設定: {self.environment}")


# クラス変数を正しく設定
Settings._instance = None
