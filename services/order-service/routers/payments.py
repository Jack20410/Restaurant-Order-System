from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database_orders import SessionLocal
from models import Payment, Order
from datetime import datetime

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class PaymentCreate(BaseModel):
    order_id: int
    customer_id: int
    amount: float
    payment_type: str

@router.post("/")
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    try:
        # Check if order exists
        order = db.query(Order).filter(Order.order_id == payment.order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Create new payment
        new_payment = Payment(
            order_id=payment.order_id,

            amount=payment.amount,
            payment_type=payment.payment_type,
            created_at=datetime.now()
        )
        db.add(new_payment)
        db.commit()
        db.refresh(new_payment)

        # Update order status to paid
        order.order_status = 'paid'
        db.commit()

        return {"message": "Payment processed successfully", "payment_id": new_payment.payment_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{payment_id}")
def get_payment(payment_id: int):
    payment = payment_service.get_payment(payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment
