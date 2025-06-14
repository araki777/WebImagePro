from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.base import LoggingRoute, base_router
from app.api.routes import (
    auth,
    contacts,
    images,
    roles,
    user_profiles,
    user_roles,
    user_settings,
)
from app.core.config import settings

app = FastAPI(
    title="WebImagePro API",
    description="WebImagePro API",
    version="1.0.0",
    docs_url="/docs" if settings.IS_DEVELOPMENT else None,
    redoc_url="/redoc" if settings.IS_DEVELOPMENT else None,
    route_class=LoggingRoute,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 各APIルーターをベースルーターに追加
base_router.include_router(auth.router, prefix="/auth", tags=["auth"])
base_router.include_router(
    user_profiles.router, prefix="/users", tags=["user_profiles"]
)
base_router.include_router(user_roles.router, prefix="/users", tags=["user_roles"])
base_router.include_router(
    user_settings.router, prefix="/users", tags=["user_settings"]
)
base_router.include_router(roles.router, prefix="/roles", tags=["roles"])
base_router.include_router(images.router, prefix="/images", tags=["images"])
base_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])

# ベースルーターをアプリケーションに追加
app.include_router(base_router)
