from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from services.kitchen_order_service import kitchen_order_service
from pydantic import BaseModel

router = APIRouter()

class OrderStatusUpdate(BaseModel):
    status: str

@router.get("/", response_model=List[Dict[str, Any]])
def get_active_orders(table_id: Optional[int] = None):
    """
    Get all active orders, optionally filtered by table
    """
    return kitchen_order_service.get_active_orders(table_id)

@router.get("/{order_id}", response_model=Dict[str, Any])
def get_order(order_id: int):
    """
    Get a specific order by ID
    """
    return kitchen_order_service.get_order(order_id)

@router.put("/{order_id}/status", response_model=Dict[str, str])
def update_order_status(order_id: int, status_update: OrderStatusUpdate):
    """
    Update the status of an order
    
    Valid statuses:
    - preparing: The kitchen is preparing the order
    - completed: The order is ready to be served
    - canceled: The order has been canceled
    """
    # Validate the status
    valid_statuses = ["preparing", "completed", "canceled"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Valid statuses are: {', '.join(valid_statuses)}"
        )
    
    return kitchen_order_service.update_order_status(order_id, status_update.status) 