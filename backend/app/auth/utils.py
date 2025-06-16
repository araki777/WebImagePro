from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.connection import get_supabase_client

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    現在のユーザー情報を取得する

    Args:
        request (Request): リクエストオブジェクト
        credentials (HTTPAuthorizationCredentials): Bearerトークン（オプション）

    Returns:
        User: ユーザーオブジェクト
    """
    try:
        supabase = get_supabase_client()
        # まずCookieからアクセストークンを取得
        access_token = request.cookies.get("access_token")
        
        # Cookieにトークンがない場合は、Bearerトークンを試す
        if not access_token and credentials:
            access_token = credentials.credentials

        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # トークンを検証
        user = supabase.auth.get_user(access_token)
        return user  # ユーザーオブジェクトをそのまま返す
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
