from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import database, models

router = APIRouter()

@router.post("/")
def process_payment(payment: models.Payment, db: Session = Depends(database.SessionLocal)):
    db.add(payment)
    db.commit()
    return {"message": "Payment processed successfully"}
