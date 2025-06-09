from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.connection import get_supabase_client

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    現在のユーザー情報を取得する

    Args:
        credentials (HTTPAuthorizationCredentials): JWTトークン

    Returns:
        User: ユーザーオブジェクト
    """
    try:
        supabase = get_supabase_client()
        # トークンを検証
        user = supabase.auth.get_user(credentials.credentials)
        return user  # ユーザーオブジェクトをそのまま返す
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

