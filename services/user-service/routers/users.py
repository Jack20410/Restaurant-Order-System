from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import database, models
from database import SessionLocal
from schemas import UserCreate, UserResponse
from services import user_service
from models import UserRole, ShiftType

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """Get all user accounts"""
    return user_service.get_all_users(db)

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    db_user = user_service.get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.post("/create", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user account"""
    # Check if user with this email already exists
    db_user = user_service.get_user_by_email(db, email=user.mail)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    return user_service.create_user(db=db, user=user)
