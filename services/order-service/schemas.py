from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OrderItemCreate(BaseModel):
    food_id: int
    quantity: int
    note: Optional[str] = None

class OrderCreate(BaseModel):
    customer_id: int
    employee_id: int
    table_id: int
    total_price: float
    items: List[OrderItemCreate]

class OrderItem(OrderItemCreate):
    order_item_id: int
    order_id: int

    class Config:
        orm_mode = True

class Order(OrderCreate):
    order_id: int
    order_status: str
    created_at: datetime
    items: List[OrderItem]

    class Config:
        orm_mode = True