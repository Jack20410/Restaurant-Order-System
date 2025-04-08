from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from database import SessionLocal
from services import user_service
from schemas import Token, TokenVerifyRequest
from passlib.context import CryptContext
import auth as auth_utils
from models import UserRole
from pydantic import BaseModel
from typing import List

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Custom form for login
class LoginForm(BaseModel):
    mail: str
    password: str

# User response model
class UserResponse(BaseModel):
    user_id: int
    name: str
    mail: str
    role: str
    shifts: str

    class Config:
        from_attributes = True

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login", response_model=Token)
def login(form_data: LoginForm, db: Session = Depends(get_db)):
    """
    Login with email and password
    """
    user = user_service.get_user_by_email(db, email=form_data.mail)
    if not user or not pwd_context.verify(form_data.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    token = auth_utils.create_access_token(
        data={"sub": user.mail, "role": user.role.value}
    )
    return {"access_token": token, "token_type": "bearer"}

@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """
    Get all users (requires manager role)
    """
    users = user_service.get_all_users(db)
    return users

@router.post("/verify")
def verify_token(request: TokenVerifyRequest):
    """
    Verify a token and check if the user has the required role
    """
    payload = auth_utils.decode_token(request.token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_role = payload.get("role")
    if not user_role:
        raise HTTPException(status_code=401, detail="Role information missing from token")
    
    # If no specific role is required, just verify the token is valid
    if not request.required_role:
        return {"valid": True, "role": user_role}
    
    # Check if the user has the required role
    if request.required_role == "manager" and user_role != UserRole.MANAGER.value:
        raise HTTPException(status_code=403, detail="Manager role required")
    
    if request.required_role == "kitchen" and user_role not in [UserRole.KITCHEN.value, UserRole.MANAGER.value]:
        raise HTTPException(status_code=403, detail="Kitchen staff or manager role required")
    
    if request.required_role == "waiter" and user_role not in [UserRole.WAITER.value, UserRole.MANAGER.value]:
        raise HTTPException(status_code=403, detail="Waiter or manager role required")
    
    return {"valid": True, "role": user_role}

@router.post("/logout")
def logout():
    """
    Logout the current user
    Note: In a stateless JWT setup, the client just needs to remove the token.
    This endpoint is provided for consistency and future extensions (like token blacklisting).
    """
    return {"message": "Successfully logged out"} 