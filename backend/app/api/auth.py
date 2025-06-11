import os

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.connection import get_supabase_client
from app.schemas.auth import Token, UserSignIn, UserSignUp

load_dotenv()

router = APIRouter()
security = HTTPBearer()


@router.post("/signup", response_model=Token)
async def signup(user_data: UserSignUp):
    """
    新規ユーザー登録
    """
    try:
        supabase = get_supabase_client()
        response = supabase.auth.sign_up(
            {
                "email": user_data.email,
                "password": user_data.password,
            }
        )

        # サインアップ成功後、自動的にサインイン
        sign_in_response = supabase.auth.sign_in_with_password(
            {"email": user_data.email, "password": user_data.password}
        )

        return {
            "access_token": sign_in_response.session.access_token,
            "token_type": "bearer",
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/signin", response_model=Token)
async def signin(user_data: UserSignIn):
    """
    ユーザーログイン
    """
    try:
        supabase = get_supabase_client()
        response = supabase.auth.sign_in_with_password(
            {"email": user_data.email, "password": user_data.password}
        )

        return {"access_token": response.session.access_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/signout")
async def signout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    ユーザーログアウト
    """
    try:
        supabase = get_supabase_client()
        response = supabase.auth.sign_out()
        return {"message": "ログアウトしました"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/github")
async def github_auth():
    """
    GitHub認証
    """
    try:
        # フロントエンドのURLを.envから取得
        frontend_url = os.getenv("FRONTEND_URL")
        supabase = get_supabase_client()
        response = supabase.auth.sign_in_with_oauth(
            {
                "provider": "github",
                "options": {"redirectTo": f"{frontend_url}/auth/callback"},
            }
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/google")
async def google_auth():
    """
    Google認証のURLを取得
    """
    try:
        supabase = get_supabase_client()
        response = supabase.auth.sign_in_with_oauth(
            {
                "provider": "google",
                "options": {"redirectTo": f"{frontend_url}/auth/callback"},
            }
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
