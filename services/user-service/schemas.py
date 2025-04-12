from pydantic import BaseModel, EmailStr
from typing import Optional
from models import UserRole, ShiftType

class UserBase(BaseModel):
    name: str
    mail: EmailStr
    role: UserRole
    shifts: Optional[ShiftType] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: int

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    shifts: Optional[ShiftType] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenVerifyRequest(BaseModel):
    token: str
    required_role: Optional[str] = None

class TokenPayload(BaseModel):
    sub: str
    role: str
    exp: int 