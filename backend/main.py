from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, user_profiles
import os
from dotenv import load_dotenv
import logging

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv(".env")

is_development = os.getenv("ENVIRONMENT") == "development"

app = FastAPI(
    title="WebImagePro API",
    description="WebImageProのバックエンドAPI",
    version="1.0.0",
    docs_url="/docs" if is_development else None,
    redoc_url="/redoc" if is_development else None
)

# CORSの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルートパスへのアクセスをSwagger UIにリダイレクト
@app.get("/")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0"
    }

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user_profiles.router, prefix="/users", tags=["users"])