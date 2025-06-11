import os
from typing import Generator, Optional

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from supabase import Client, create_client

# .envファイルの読み込み
load_dotenv()


def get_database_url() -> str:
    """
    環境変数からデータベース接続文字列を生成する

    Returns:
        str: データベース接続文字列
    """
    # 環境変数から必要な情報を取得（デフォルト値を設定）
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "postgres")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")  # デフォルトのPostgreSQLポート
    db_name = os.getenv("DB_NAME", "postgres")

    # 接続文字列を生成
    database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    return database_url


def get_supabase_client() -> Client:
    """
    Supabaseクライアントを生成する

    Returns:
        Client: Supabaseクライアント
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables"
        )

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


def get_frontend_url() -> str:
    """
    フロントエンドのURLを取得する

    Returns:
        str: フロントエンドのURL
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return frontend_url
