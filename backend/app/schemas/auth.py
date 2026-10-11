from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserSignUpRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "rescuer"
    avatar_url: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
    role: Optional[str] = "analyst"

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    avatar_url: Optional[str] = None
    created_at: Optional[str] = None
    last_login: Optional[str] = None

class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    message: str
