from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from database import db

# Collections
food_menu = db["food_menu"]
kitchen_orders = db["kitchen_orders"]

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

# === Kitchen Orders Models ===
class OrderItem(BaseModel):
    item_id: str
    name: str
    quantity: int
    notes: Optional[str] = None

class KitchenOrder(BaseModel):
    order_id: str
    table_id: Optional[str] = None
    items: List[OrderItem]
    special_instructions: Optional[str] = None
    priority: Optional[str] = "normal"
    status: str = "pending"  # pending, preparing, ready, completed, cancelled

class OrderStatusUpdate(BaseModel):
    status: str
