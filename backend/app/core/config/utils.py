"""
環境変数取得とバリデーション用ユーティリティ
"""

import os
import re
from typing import Optional
from urllib.parse import urlparse


def get_env(key: str, default: Optional[str] = None) -> str:
    """環境変数を取得（デフォルト値対応）"""
    value = os.getenv(key, default)
    if value is None:
        raise ValueError(f"環境変数{key}が設定されていません")
    return value


def get_env_optional(key: str) -> Optional[str]:
    """オプション環境変数を取得"""
    return os.getenv(key)


def parse_int_env(key: str, default: Optional[int] = None) -> int:
    """環境変数を整数として解析"""
    value = get_env(key) if default is None else get_env(key, str(default))
    try:
        return int(value)
    except ValueError:
        raise ValueError(f"環境変数{key}は整数ではありません: {value}")


def parse_bool_env(key: str, default: bool = False) -> bool:
    """環境変数をブール値として解析"""
    value = get_env(key, str(default))
    return value.lower() in ("true", "1", "yes", "on")


def validate_url(url: str, key: str) -> str:
    """URL形式を検証"""
    try:
        result = urlparse(url)
        if not all([result.scheme, result.netloc]):
            raise ValueError(f"環境変数{key}は有効なURLではありません: {url}")
        return url
    except Exception as e:
        raise ValueError(f"環境変数{key}のURL形式が無効です: {url}") from e


def validate_email(email: str, key: str) -> str:
    """メールアドレス形式を検証"""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email):
        raise ValueError(f"環境変数{key}は有効なメールアドレスではありません: {email}")
    return email
