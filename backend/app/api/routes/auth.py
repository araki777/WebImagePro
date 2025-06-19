from typing import Dict

from fastapi import APIRouter, Depends, Request, Response

from app.api.base import LoggingRoute
from app.connection import get_db, get_supabase_admin_client, get_supabase_client
from app.core.config import settings
from app.core.constants import OAUTH_PROVIDER
from app.core.error_handlers import handle_api_errors
from app.schemas.auth import (
    OAuthResponse,
    ResetPasswordRequest,
    SendEmailRequest,
    Token,
    UserResponse,
    UserSignIn,
    UserSignUp,
)
from app.services.auth import AuthService

# 新しいルーターを作成
router = APIRouter(route_class=LoggingRoute)


def get_auth_service():
    db = next(get_db())
    supabase = get_supabase_client()
    return AuthService(supabase, db)


def get_admin_auth_service():
    db = next(get_db())
    supabase = get_supabase_admin_client()
    return AuthService(supabase, db)


@router.get("/me", response_model=UserResponse)
@handle_api_errors("auth", "get_me")
async def get_me(
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    ログイン中のユーザー情報を取得

    Args:
        request: リクエスト
        auth_service: 認証サービス

    Returns:
        UserResponse: ユーザー情報

    Raises:
        HTTPException: 認証エラーまたはサーバーエラー
    """

    return await auth_service.get_me(request)


@router.post("/signup", response_model=dict)
@handle_api_errors("auth", "signup")
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
        dict: 認証トークン情報

    Raises:
        HTTPException: 認証エラーまたはサーバーエラー
    """

    return await auth_service.signup(user_data)


@router.post("/signin", response_model=Token)
@handle_api_errors("auth", "signin")
async def signin(
    user_data: UserSignIn,
    response: Response,
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

    token = await auth_service.signin(user_data)

    # クッキーを設定
    response.set_cookie(
        key="access_token",
        value=token.access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
        path="/",
    )

    return token


@router.post("/signout", response_model=Dict[str, str])
@handle_api_errors("auth", "signout")
async def signout(
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    ユーザーログアウト

    Args:
        auth_service: 認証サービス

    Raises:
        HTTPException: 認証エラーまたはサーバーエラー
    """
    await auth_service.signout()
    response.delete_cookie("access_token")
    return {"message": "ログアウトしました"}


@router.get("/github", response_model=OAuthResponse)
@handle_api_errors("auth", "github")
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
@handle_api_errors("auth", "google")
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


@router.post("/reset-password", response_model=Dict[str, str])
@handle_api_errors("auth", "reset_password")
async def reset_password(
    reset_data: ResetPasswordRequest,
    auth_service: AuthService = Depends(get_admin_auth_service),
):
    """
    パスワード再設定

    Args:
        reset_data: パスワード再設定情報
        auth_service: 認証サービス

    Returns:
        Dict[str, str]: パスワード再設定結果のメッセージ
    """
    return await auth_service.reset_password(reset_data.token, reset_data.password)


@router.post("/send-email", response_model=Dict[str, str])
@handle_api_errors("auth", "send_email")
async def send_email(
    email_data: SendEmailRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    メール送信

    Args:
        email_data: メールアドレス
        auth_service: 認証サービス

    Returns:
        Dict[str, str]: メール送信結果のメッセージ
    """
    return await auth_service.send_email(email_data.email)
