from fastapi import APIRouter, Header, HTTPException, Depends
from typing import Dict, Any, List
from models import FoodItem, FoodStatusUpdate, BatchFoodStatusUpdate
from services.menu_service import MenuService
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

@router.get("/", response_model=List[Dict[str, Any]])
def view_menu():
    """
    Lấy danh sách tất cả các món ăn trong menu
    Public endpoint - no authentication required
    """
    return MenuService.view_menu()

@router.get("/available", response_model=List[Dict[str, Any]])
def view_available_menu():
    """
    Lấy danh sách các món ăn hiện có sẵn (availability = true)
    Public endpoint - no authentication required
    """
    return MenuService.view_menu_by_availability(True)

@router.get("/unavailable", response_model=List[Dict[str, Any]])
def view_unavailable_menu():
    """
    Lấy danh sách các món ăn hiện không có sẵn (availability = false)
    Public endpoint - no authentication required
    """
    return MenuService.view_menu_by_availability(False)

@router.get("/category/{category}", response_model=List[Dict[str, Any]])
def view_menu_by_category(category: str):
    """
    Lấy danh sách món ăn theo category
    Các category có sẵn: SoupBase, SignatureFood, SideDish, Meat, Beverages&Desserts
    Public endpoint - no authentication required
    """
    return MenuService.view_menu_by_category(category)

@router.get("/{food_id}", response_model=Dict[str, Any])
def view_food_by_id(food_id: str):
    """
    Lấy thông tin chi tiết của một món ăn cụ thể
    Public endpoint - no authentication required
    """
    return MenuService.view_food_by_id(food_id)

@router.post("/", response_model=Dict[str, str])
async def add_food(
    item: FoodItem,
    _: bool = Depends(verify_kitchen_role)
):
    """
    Thêm món ăn mới vào menu
    Restricted to kitchen staff and managers
    """
    return MenuService.add_food(item)

@router.patch("/{food_id}/availability", response_model=Dict[str, str])
async def change_menu_availability(
    food_id: str, 
    update_data: FoodStatusUpdate,
    _: bool = Depends(verify_kitchen_role)
):
    """
    Cập nhật trạng thái availability của món ăn (true/false)
    Restricted to kitchen staff and managers
    """
    return MenuService.change_menu_availability(food_id, update_data)

@router.patch("/batch-update", response_model=Dict[str, Any])
async def batch_update_availability(
    update_data: BatchFoodStatusUpdate,
    _: bool = Depends(verify_kitchen_role)
):
    """
    Cập nhật trạng thái availability cho nhiều món ăn cùng lúc
    Body JSON format: {"food_ids": ["id1", "id2", ...], "availability": true/false}
    Restricted to kitchen staff and managers
    """
    return MenuService.batch_update_availability(update_data)
