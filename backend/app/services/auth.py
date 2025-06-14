from typing import Dict

from supabase import Client

from app.schemas.auth import Token, UserSignIn, UserSignUp


class AuthService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

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
