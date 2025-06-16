from uuid import UUID

from pydantic import BaseModel, EmailStr, HttpUrl

from app.schemas.user_profile import UserProfile
from app.schemas.user_role import UserRole
from app.schemas.user_setting import UserSetting


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    user_profile: UserProfile | None = None
    user_setting: UserSetting | None = None
    user_role: UserRole | None = None


class UserSignUp(BaseModel):
    email: EmailStr
    password: str


class UserSignIn(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600


class OAuthResponse(BaseModel):
    url: HttpUrl
    provider: str
