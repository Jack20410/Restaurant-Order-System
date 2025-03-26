from sqlalchemy.orm import Session
from typing import List
from models import User
from schemas import UserCreate
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    db_user = User(
        name=user.name,
        mail=user.mail,
        password=hashed_password,
        role=user.role,
        shifts=user.shifts
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.mail == email).first()

def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.user_id == user_id).first()

def get_all_users(db: Session) -> List[User]:
    return db.query(User).all()
