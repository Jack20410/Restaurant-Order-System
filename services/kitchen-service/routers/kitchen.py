from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import requests
import os
from datetime import datetime

router = APIRouter()

# Order service URL from environment variable or default
ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://order-service:8002")

@router.post("/", response_model=Dict[str, Any])
async def create_kitchen_order(order: Dict[str, Any]):
    """
    Proxy endpoint to forward new orders to order service
    """
    try:
        response = requests.post(
            f"{ORDER_SERVICE_URL}/api/orders",
            json=order
        )
        response.raise_for_status()
        
        # Add real-time notification information
        result = response.json()
        result["notification"] = {
            "type": "new_order",
            "message": f"New order received for Table {order.get('table_id', 'Unknown')}",
            "timestamp": datetime.now().isoformat()
        }
        
        return result
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Order service unavailable: {str(e)}")

@router.put("/{order_id}", response_model=Dict[str, str])
async def update_order_status(order_id: str, update_data: Dict[str, str]):
    """
    Proxy endpoint to forward order status updates to order service
    """
    try:
        response = requests.put(
            f"{ORDER_SERVICE_URL}/api/orders/{order_id}/status",
            json=update_data
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Order service unavailable: {str(e)}")

@router.patch("/{order_id}/serve", response_model=Dict[str, Any])
async def mark_items_served(order_id: str, update_data: Dict[str, Any]):
    """
    Proxy endpoint to forward serve updates to order service
    """
    try:
        response = requests.patch(
            f"{ORDER_SERVICE_URL}/api/orders/{order_id}/serve",
            json=update_data
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Order service unavailable: {str(e)}")

@router.get("/", response_model=List[Dict[str, Any]])
async def get_all_kitchen_orders():
    """
    Proxy endpoint to get all orders from order service
    """
    try:
        response = requests.get(f"{ORDER_SERVICE_URL}/api/orders/active")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Order service unavailable: {str(e)}")

@router.get("/ready-to-serve", response_model=List[Dict[str, Any]])
async def get_ready_to_serve_orders():
    """
    Proxy endpoint to get ready-to-serve orders from order service
    """
    try:
        response = requests.get(f"{ORDER_SERVICE_URL}/api/orders/ready-to-serve")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Order service unavailable: {str(e)}")

@router.get("/partially-served", response_model=List[Dict[str, Any]])
async def get_partially_served_orders():
    """
    Proxy endpoint to get partially served orders from order service
    """
    try:
        response = requests.get(f"{ORDER_SERVICE_URL}/api/orders/partially-served")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Order service unavailable: {str(e)}")

@router.get("/{order_id}", response_model=Dict[str, Any])
async def get_kitchen_order(order_id: str):
    """
    Proxy endpoint to get specific order from order service
    """
    try:
        response = requests.get(f"{ORDER_SERVICE_URL}/api/orders/{order_id}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Order service unavailable: {str(e)}") 