# routers/orders.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/")
def create_order(order: dict):
    return {"message": "Order created", "order": order}

@router.put("/{order_id}")
def update_order(order_id: int, order: dict):
    return {"message": f"Order {order_id} updated", "order": order}
