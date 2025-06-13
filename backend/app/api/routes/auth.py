from typing import Dict

from fastapi import APIRouter, Depends

from app.api.base import LoggingRoute
from app.connection import get_supabase_client
from app.core.config import settings
from app.core.constants import OAUTH_PROVIDER
from app.core.error_handlers import handle_api_errors
from app.schemas.auth import OAuthResponse, Token, UserSignIn, UserSignUp
from app.services.auth import AuthService

# 新しいルーターを作成
router = APIRouter(route_class=LoggingRoute)


def get_auth_service():
    return AuthService(get_supabase_client())


@router.post("/signup", response_model=Token)
@handle_api_errors("auth")
async def signup(
    user_data: UserSignUp,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    新規ユーザー登録

    Args:
        user_data: ユーザー登録情報
        auth_service: 認証サービス

    Returns:
        Token: 認証トークン情報

    Raises:
        HTTPException: 認証エラーまたはサーバーエラー
    """

    return await auth_service.signup(user_data)


@router.post("/signin", response_model=Token)
@handle_api_errors("auth")
async def signin(
    user_data: UserSignIn,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    ユーザーログイン

    Args:
        user_data: ユーザーログイン情報
        auth_service: 認証サービス

    Returns:
        Token: 認証トークン情報

    Raises:
        HTTPException: 認証エラーまたはサーバーエラー
    """
    return await auth_service.signin(user_data)


@router.post("/signout", response_model=Dict[str, str])
@handle_api_errors("auth")
async def signout(
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    ユーザーログアウト

    Args:
        auth_service: 認証サービス

    Returns:
        Dict[str, str]: ログアウト結果のメッセージ

    Raises:
        HTTPException: 認証エラーまたはサーバーエラー
    """
    return await auth_service.signout()


@router.get("/github", response_model=OAuthResponse)
@handle_api_errors("auth")
async def github_auth(
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    GitHub認証

    Args:
        auth_service: 認証サービス

    Returns:
        OAuthResponse: 認証URL情報

    Raises:
        HTTPException: 認証エラーまたはサーバーエラー
    """
    frontend_url = settings.FRONTEND_URL
    if not frontend_url:
        raise ValueError("FRONTEND_URLが設定されていません")
    return await auth_service.get_oauth_url(OAUTH_PROVIDER["github"], frontend_url)


@router.get("/google", response_model=OAuthResponse)
@handle_api_errors("auth")
async def google_auth(
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Google認証のURLを取得

    Args:
        auth_service: 認証サービス

    Returns:
        OAuthResponse: 認証URL情報

    Raises:
        HTTPException: 認証エラーまたはサーバーエラー
    """
    frontend_url = settings.FRONTEND_URL
    if not frontend_url:
        raise ValueError("FRONTEND_URLが設定されていません")
    return await auth_service.get_oauth_url(OAUTH_PROVIDER["google"], frontend_url)
