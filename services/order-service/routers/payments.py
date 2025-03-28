from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database_orders import SessionLocal
from models import Payment

router = APIRouter()

class PaymentCreate(BaseModel):
    order_id: int
    amount: int
    payment_method: str  # Add payment method

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_payment(payment_data: PaymentCreate, db: Session = Depends(get_db)):
    payment = Payment(
        order_id=payment_data.order_id,
        amount=payment_data.amount,
        payment_method=payment_data.payment_method
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {"message": "Payment processed", "payment": payment}
