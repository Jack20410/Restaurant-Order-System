from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import SessionLocal
from services import user_service
from schemas import Token
from passlib.context import CryptContext
import auth as auth_utils

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login with username (email) and password
    """
    user = user_service.get_user_by_email(db, email=form_data.username)
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

@router.post("/logout")
def logout():
    """
    Logout the current user
    Note: In a stateless JWT setup, the client just needs to remove the token.
    This endpoint is provided for consistency and future extensions (like token blacklisting).
    """
    return {"message": "Successfully logged out"} 