"""
データベース設定
"""

from dataclasses import dataclass

from .utils import get_env, parse_int_env


@dataclass
class DatabaseSettings:
    """データベース設定"""

    user: str
    password: str
    host: str
    port: int
    name: str

    @classmethod
    def from_env(cls) -> "DatabaseSettings":
        return cls(
            user=get_env("DB_USER"),
            password=get_env("DB_PASSWORD"),
            host=get_env("DB_HOST"),
            port=parse_int_env("DB_PORT", 5432),
            name=get_env("DB_NAME"),
        )

    @property
    def connection_string(self) -> str:
        """データベース接続文字列を生成"""
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"
