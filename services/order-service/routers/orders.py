from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database_orders import SessionLocal
from models import Order
from typing import List

router = APIRouter()

class OrderItem(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItem]
    total: float

class OrderUpdate(BaseModel):
    details: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    order = Order(
        customer_id=order_data.customer_id,
        items=str(order_data.items),  # Convert list to JSON string
        total=order_data.total
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"message": "Order created", "order": order}

@router.put("/{id}")
def update_order(id: int, order_data: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.details = order_data.details
    db.commit()
    return {"message": "Order updated", "order": order}
