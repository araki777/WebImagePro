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

            user_profile = UserProfileService(self.db).get_user_profile(user_id)
            user_setting = UserSettingService(self.db).get_user_setting(user_id)
            user_role = UserRoleService(self.db).get_user_role(user_id)

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

    async def signup(self, user_data: UserSignUp) -> Token:
        """
        新規ユーザー登録
        """
        response = self.supabase.auth.sign_up(
            {"email": user_data.email, "password": user_data.password}
        )

        if response.session is None:
            return Token(access_token="", token_type="bearer")

        sign_in_response = self.supabase.auth.sign_in_with_password(
            {"email": user_data.email, "password": user_data.password}
        )

        if sign_in_response.session is None:
            raise ValueError(
                "認証に失敗しました。メールアドレスとパスワードを確認してください。"
            )

        return Token(
            access_token=sign_in_response.session.access_token, token_type="bearer"
        )

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
                "options": {"redirect_to": f"{frontend_url}/auth/callback"},
            }
        )
        return response
