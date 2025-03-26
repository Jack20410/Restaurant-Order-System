from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import database, models, auth
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/")
def create_user(user: models.User, db: Session = Depends(database.SessionLocal)):
    user.password = pwd_context.hash(user.password)
    db.add(user)
    db.commit()
    return {"message": "User created successfully"}

@router.post("/login")
def login(mail: str, password: str, db: Session = Depends(database.SessionLocal)):
    user = db.query(models.User).filter(models.User.mail == mail).first()
    if not user or not pwd_context.verify(password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = auth.create_access_token({"sub": user.mail, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}
