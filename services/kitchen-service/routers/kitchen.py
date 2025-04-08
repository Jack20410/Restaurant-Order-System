from fastapi import APIRouter, Header, HTTPException, Depends
from typing import Dict, Any, List
from models import KitchenOrder, OrderStatusUpdate, OrderServeUpdate
from services.kitchen_service import KitchenService
import requests

router = APIRouter()

async def verify_kitchen_role(authorization: str = Header(...)):
    """
    Verify that the current user has kitchen or manager role
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = authorization.replace("Bearer ", "")
    # Call user-service to verify token and role
    try:
        response = requests.post(
            "http://user-service:8001/auth/verify",
            json={"token": token, "required_role": "kitchen"}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=403,
                detail="Kitchen staff or manager role required"
            )
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Authentication service unavailable")
    
    return True

async def verify_waiter_role(authorization: str = Header(...)):
    """
    Verify that the current user has waiter or manager role
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = authorization.replace("Bearer ", "")
    # Call user-service to verify token and role
    try:
        response = requests.post(
            "http://user-service:8001/auth/verify",
            json={"token": token, "required_role": "waiter"}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=403,
                detail="Waiter or manager role required"
            )
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Authentication service unavailable")
    
    return True

@router.post("/", response_model=Dict[str, Any])
async def create_kitchen_order(
    order: KitchenOrder,
    _: bool = Depends(verify_waiter_role)
):
    """
    Nhận đơn hàng mới từ Order Service
    Restricted to waiters and managers
    """
    return KitchenService.create_kitchen_order(order)

@router.put("/{order_id}", response_model=Dict[str, str])
async def update_order_status(
    order_id: str,
    update_data: OrderStatusUpdate,
    _: bool = Depends(verify_kitchen_role)
):
    """
    Cập nhật trạng thái đơn hàng
    Restricted to kitchen staff and managers
    """
    return KitchenService.update_order_status(order_id, update_data)

@router.patch("/{order_id}/serve", response_model=Dict[str, Any])
async def mark_items_served(
    order_id: str,
    update_data: OrderServeUpdate,
    _: bool = Depends(verify_waiter_role)
):
    """
    Đánh dấu các món ăn đã được phục vụ trong một đơn hàng
    Body JSON format: {"item_indices": [0, 1, 2]} - Các chỉ số của món ăn trong danh sách items
    Restricted to waiters and managers
    """
    return KitchenService.mark_items_served(order_id, update_data)

@router.get("/", response_model=List[Dict[str, Any]])
async def get_all_kitchen_orders(
    _: bool = Depends(verify_kitchen_role)
):
    """
    Lấy danh sách tất cả các đơn hàng
    Restricted to kitchen staff and managers
    """
    return KitchenService.get_all_kitchen_orders()

@router.get("/ready-to-serve", response_model=List[Dict[str, Any]])
async def get_ready_to_serve_orders(
    _: bool = Depends(verify_waiter_role)
):
    """
    Lấy danh sách các đơn hàng đã sẵn sàng để phục vụ (status = ready)
    nhưng chưa được đánh dấu là đã phục vụ hoàn toàn
    Restricted to waiters and managers
    """
    return KitchenService.get_ready_to_serve_orders()

@router.get("/partially-served", response_model=List[Dict[str, Any]])
async def get_partially_served_orders(
    _: bool = Depends(verify_waiter_role)
):
    """
    Lấy danh sách các đơn hàng đã được phục vụ một phần
    (có ít nhất một món đã phục vụ và ít nhất một món chưa phục vụ)
    Restricted to waiters and managers
    """
    return KitchenService.get_partially_served_orders()

@router.get("/{order_id}", response_model=Dict[str, Any])
async def get_kitchen_order(
    order_id: str,
    authorization: str = Header(...)
):
    """
    Lấy thông tin chi tiết của một đơn hàng cụ thể
    Accessible to both kitchen staff and waiters
    """
    # First try as kitchen staff, then as waiter if kitchen check fails
    try:
        await verify_kitchen_role(authorization)
    except HTTPException:
        try:
            await verify_waiter_role(authorization)
        except HTTPException:
            raise HTTPException(
                status_code=403,
                detail="Authorization required to view order details"
            )
    
    return KitchenService.get_kitchen_order(order_id) 