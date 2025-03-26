from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import database, models

router = APIRouter()

@router.post("/")
def create_order(order: models.Order, db: Session = Depends(database.SessionLocal)):
    db.add(order)
    db.commit()
    return {"message": "Order created successfully"}
