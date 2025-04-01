from fastapi import APIRouter
from typing import Dict, Any, List
from models import KitchenOrder, OrderStatusUpdate
from services.kitchen_service import KitchenService

router = APIRouter()

@router.post("/", response_model=Dict[str, Any])
def create_kitchen_order(order: KitchenOrder):
    """
    Nhận đơn hàng mới từ Order Service
    """
    return KitchenService.create_kitchen_order(order)

@router.put("/{order_id}", response_model=Dict[str, str])
def update_order_status(order_id: str, update_data: OrderStatusUpdate):
    """
    Cập nhật trạng thái đơn hàng
    """
    return KitchenService.update_order_status(order_id, update_data)

@router.get("/", response_model=List[Dict[str, Any]])
def get_all_kitchen_orders():
    """
    Lấy danh sách tất cả các đơn hàng
    """
    return KitchenService.get_all_kitchen_orders()

@router.get("/{order_id}", response_model=Dict[str, Any])
def get_kitchen_order(order_id: str):
    """
    Lấy thông tin chi tiết của một đơn hàng cụ thể
    """
    return KitchenService.get_kitchen_order(order_id) 