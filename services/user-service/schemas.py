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

class Token(BaseModel):
    access_token: str
    token_type: str 