"""
グローバル設定インスタンス
"""

from .base import Settings

# グローバル設定インスタンス
settings = Settings.from_env()
