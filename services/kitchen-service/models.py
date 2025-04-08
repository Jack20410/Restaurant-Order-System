from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from database import db, ensure_db_connection
from enum import Enum

# === Food Menu Models ===
class FoodItem(BaseModel):
    name: str
    availability: bool = True
    image: str
    category: str
    description: str
    price: float
    food_id: str

class FoodStatusUpdate(BaseModel):
    availability: bool

class BatchFoodStatusUpdate(BaseModel):
    food_ids: List[str]
    availability: bool

# === Kitchen Orders Models ===
class OrderStatus(str, Enum):
    PENDING = "pending"
    PREPARING = "preparing"
    READY = "ready"
    SERVED = "served"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class OrderItem(BaseModel):
    item_id: str
    name: str
    quantity: int
    notes: Optional[str] = None
    is_served: bool = False

class KitchenOrder(BaseModel):
    order_id: str
    table_id: Optional[str] = None
    items: List[OrderItem]
    special_instructions: Optional[str] = None
    priority: Optional[str] = "normal"
    status: OrderStatus = OrderStatus.PENDING

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class OrderServeUpdate(BaseModel):
    item_indices: List[int]  # Indices of items being served

# Functions to get database collections
def get_food_menu():
    try:
        ensure_db_connection()
        if db is None:
            raise Exception("Database connection is not initialized")
        return db["food_menu"]
    except Exception as e:
        print(f"Error accessing food_menu collection: {str(e)}")
        raise

def get_kitchen_orders():
    try:
        ensure_db_connection()
        if db is None:
            raise Exception("Database connection is not initialized")
        return db["kitchen_orders"]
    except Exception as e:
        print(f"Error accessing kitchen_orders collection: {str(e)}")
        raise
