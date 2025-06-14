from pydantic import BaseModel, EmailStr, HttpUrl


class UserSignUp(BaseModel):
    email: EmailStr
    password: str


class UserSignIn(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OAuthResponse(BaseModel):
    url: HttpUrl
    provider: str
