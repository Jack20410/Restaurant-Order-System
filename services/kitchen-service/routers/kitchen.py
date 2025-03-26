from fastapi import APIRouter, HTTPException
from database import db

router = APIRouter()
kitchen_orders = db["kitchen_orders"]

@router.get("/")
def get_orders():
    return list(kitchen_orders.find({}, {"_id": 0}))

@router.post("/")
def receive_order(order: dict):
    kitchen_orders.insert_one(order)
    return {"message": "Order received in kitchen"}

@router.put("/{order_id}")
def update_order_status(order_id: str, status: str):
    result = kitchen_orders.update_one({"order_id": order_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}
