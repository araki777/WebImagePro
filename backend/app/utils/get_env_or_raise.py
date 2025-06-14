import os


def get_env_or_raise(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise ValueError(f"環境変数 {key} が設定されていません")
    return value
