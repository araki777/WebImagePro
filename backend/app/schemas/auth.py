from pydantic import BaseModel, EmailStr

class UserSignUp(BaseModel):
    email: EmailStr
    password: str

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"