from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import database, models, auth
from passlib.context import CryptContext
from database import SessionLocal
from schemas import UserCreate, UserResponse
from services import user_service
from models import UserRole, ShiftType

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user with this email already exists
    db_user = user_service.get_user_by_email(db, email=user.mail)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    return user_service.create_user(db=db, user=user)

@router.post("/login")
def login(mail: str, password: str, db: Session = Depends(database.SessionLocal)):
    user = db.query(models.User).filter(models.User.mail == mail).first()
    if not user or not pwd_context.verify(password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = auth.create_access_token({"sub": user.mail, "role": user.role.value})
    return {"access_token": token, "token_type": "bearer"}
