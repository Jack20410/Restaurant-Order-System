from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services import order_service
from datetime import datetime

router = APIRouter()

# Add new endpoint to get available tables
@router.get("/tables/available")
def get_available_tables():
    tables = order_service.get_available_tables()
    return {"tables": tables}

# Add new endpoint to reserve a table
@router.put("/tables/{table_id}/reserve")
def reserve_table(table_id: int):
    try:
        success = order_service.reserve_table(table_id)
        if success:
            return {"message": "Table reserved successfully", "table_id": table_id}
        raise HTTPException(status_code=404, detail="Table not found or not available")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class OrderItem(BaseModel):
    food_id: int
    quantity: int
    note: Optional[str] = None

class OrderCreate(BaseModel):
    customer_id: int
    employee_id: int
    table_id: int
    total_price: float
    items: List[OrderItem]

@router.post("/")
def create_order(order: OrderCreate):
    try:
        order_id = order_service.create_order(order.dict())
        return {"message": "Order created successfully", "order_id": order_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{order_id}")
def get_order(order_id: int):
    order = order_service.get_order_details(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

class OrderStatusUpdate(BaseModel):
    status: str

@router.put("/{order_id}/status")
def update_order_status(order_id: int, status_update: OrderStatusUpdate):
    success = order_service.update_order_status(order_id, status_update.status)
    if not success:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated successfully"}

@router.post("/tables/")
def add_table():
    try:
        new_table = order_service.create_table()
        return {"message": "Table created successfully", "table": new_table}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
