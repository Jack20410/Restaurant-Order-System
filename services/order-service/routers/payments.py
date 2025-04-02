from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database_orders import SessionLocal
from models import Payment
router = APIRouter()

class PaymentCreate(BaseModel):
    order_id: int
    customer_id: int
    amount: float

@router.post("/")
def create_payment(payment: PaymentCreate):
    try:
        payment_id = payment_service.create_payment(payment.dict())
        return {"message": "Payment processed successfully", "payment_id": payment_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{payment_id}")
def get_payment(payment_id: int):
    payment = payment_service.get_payment(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment
