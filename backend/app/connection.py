from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from supabase import Client, create_client

from app.core.config import settings


def get_database_url() -> str:
    """
    環境変数からデータベース接続文字列を生成する

    Returns:
        str: データベース接続文字列
    """
    # 環境変数から必要な情報を取得（デフォルト値を設定）
    db_user = settings.DB_USER
    db_password = settings.DB_PASSWORD
    db_host = settings.DB_HOST
    db_port = settings.DB_PORT
    db_name = settings.DB_NAME

    # 接続文字列を生成
    database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    return database_url


def get_supabase_client() -> Client:
    """
    Supabaseクライアントを生成する

    Returns:
        Client: Supabaseクライアント
    """
    supabase_url = settings.SUPABASE_URL
    supabase_key = settings.SUPABASE_ANON_KEY

    if not supabase_url or not supabase_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables"
        )

    return create_client(supabase_url, supabase_key)


def get_supabase_admin_client() -> Client:
    """
    Supabase管理クライアントを生成する

    Returns:
        Client: Supabase管理クライアント
    """
    supabase_url = settings.SUPABASE_URL
    supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY

    return create_client(supabase_url, supabase_key)


# データベース接続の設定
engine = create_engine(get_database_url())
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    データベースセッションを取得する

    Yields:
        Session: データベースセッション
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
