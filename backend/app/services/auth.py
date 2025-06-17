from typing import Dict

import jwt
from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session
from supabase import Client

from app.core.config import settings
from app.schemas.auth import Token, UserResponse, UserSignIn, UserSignUp
from app.services.user_profile import UserProfileService
from app.services.user_role import UserRoleService
from app.services.user_setting import UserSettingService


class AuthService:
    def __init__(self, supabase: Client, db: Session):
        self.supabase = supabase
        self.db = db

    async def get_me(self, request: Request) -> UserResponse:
        """
        ログイン中のユーザー情報を取得
        """
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
            )

        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            user_id = payload.get("sub")
            email = payload.get("email")

            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
                )

            user_profile = UserProfileService(self.db).get_or_create_user_profile(
                user_id
            )
            user_setting = UserSettingService(self.db).get_or_create_user_setting(
                user_id
            )
            user_role = UserRoleService(self.db).get_or_create_user_role(user_id)

            return UserResponse(
                id=user_id,
                email=email,
                user_profile=user_profile,
                user_setting=user_setting,
                user_role=user_role,
            )
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )

    async def signup(self, user_data: UserSignUp) -> dict:
        """
        新規ユーザー登録

        Returns:
            dict: 登録結果
                - success: bool - 登録成功したかどうか
                - message: str - ユーザーへのメッセージ
        """
        response = self.supabase.auth.sign_up(
            {"email": user_data.email, "password": user_data.password}
        )

        if response.session is None:
            return {
                "success": True,
                "message": "確認メールを送信しました。メール内のリンクをクリックして認証を完了してください。",
            }

        return {"success": True, "message": "登録が完了しました。"}

    async def signin(self, user_data: UserSignIn) -> Token:
        """
        ユーザーログイン
        """
        response = self.supabase.auth.sign_in_with_password(
            {"email": user_data.email, "password": user_data.password}
        )

        if response.session is None:
            raise ValueError(
                "認証に失敗しました。メールアドレスとパスワードを確認してください。"
            )

        return Token(access_token=response.session.access_token, token_type="bearer")

    async def signout(self) -> Dict:
        """
        ユーザーログアウト
        """
        self.supabase.auth.sign_out()
        return {"message": "ログアウトしました"}

    async def get_oauth_url(self, provider: str, frontend_url: str) -> Dict:
        """
        OAuth認証URLの取得
        """
        response = self.supabase.auth.sign_in_with_oauth(
            {
                "provider": provider,
                "options": {"redirect_to": f"{frontend_url}/api/auth/callback"},
            }
        )
        return response

    async def reset_password(self, password: str, token: str) -> Dict:
        """
        パスワード再設定
        """
        self.supabase.auth.update_user(
            {"password": password},
            token=token,
            options={"redirect_to": f"{settings.FRONTEND_URL}/login"},
        )
        return {"message": "パスワードを再設定しました"}

    async def send_email(self, email: str) -> Dict:
        """
        メール送信
        """
        self.supabase.auth.reset_password_for_email(
            email,
            options={"redirect_to": f"{settings.FRONTEND_URL}/resetPassword"},
        )
        return {"message": "パスワード再設定メールを送信しました"}
