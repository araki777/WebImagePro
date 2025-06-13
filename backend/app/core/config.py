import os

from dotenv import load_dotenv

from app.utils.get_env_or_raise import get_env_or_raise

load_dotenv(".env")


class Settings:
    # 基本設定
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    IS_DEVELOPMENT: bool = ENVIRONMENT == "development"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Azure Storage設定
    AZURE_STORAGE_CONNECTION_STRING: str = get_env_or_raise(
        "AZURE_STORAGE_CONNECTION_STRING"
    )
    AZURE_STORAGE_SHARED_CONTAINER_NAME: str = get_env_or_raise(
        "AZURE_STORAGE_SHARED_CONTAINER_NAME"
    )
    AZURE_STORAGE_ACCOUNT_NAME: str = get_env_or_raise("AZURE_STORAGE_ACCOUNT_NAME")

    # Azure Vision API設定
    AZURE_COMPUTE_VISION_URL: str = get_env_or_raise("AZURE_COMPUTE_VISION_URL")
    AZURE_COMPUTE_VISION_KEY: str = get_env_or_raise("AZURE_COMPUTE_VISION_KEY")

    # Azure Translation API設定
    AZURE_TRANSLATION_URL: str = get_env_or_raise("AZURE_TRANSLATION_URL")
    AZURE_TRANSLATION_KEY: str = get_env_or_raise("AZURE_TRANSLATION_KEY")
    AZURE_TRANSLATION_REGION: str = get_env_or_raise("AZURE_TRANSLATION_REGION")

    # PostgreSQL設定
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    DB_NAME: str = os.getenv("DB_NAME", "postgres")

    # Supabase設定
    SUPABASE_URL: str = get_env_or_raise("SUPABASE_URL")
    SUPABASE_ANON_KEY: str = get_env_or_raise("SUPABASE_ANON_KEY")

    # Resend設定
    RESEND_API_KEY: str = get_env_or_raise("RESEND_API_KEY")
    RESEND_EMAIL_FROM: str = get_env_or_raise("RESEND_EMAIL_FROM")
    RESEND_EMAIL_TO: str = get_env_or_raise("RESEND_EMAIL_TO")


settings = Settings()
