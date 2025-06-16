from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

app = FastAPI()

print(settings.FRONTEND_URL)

# CORS設定
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ルーターの登録
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user_settings.router, prefix="/user", tags=["user_settings"])
app.include_router(user_profiles.router, prefix="/user", tags=["user_profiles"])
app.include_router(user_roles.router, prefix="/user", tags=["user_roles"])
app.include_router(roles.router, prefix="/roles", tags=["roles"])
app.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
app.include_router(images.router, prefix="/images", tags=["images"]) 