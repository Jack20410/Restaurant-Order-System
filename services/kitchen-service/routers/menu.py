from fastapi import APIRouter, Body
from typing import Dict, Any, List
from models import FoodItem, FoodStatusUpdate
from services.menu_service import MenuService

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
def get_menu():
    """
    Lấy danh sách tất cả các món ăn trong menu
    """
    return MenuService.get_menu()

@router.get("/{food_id}", response_model=Dict[str, Any])
def get_food_item(food_id: str):
    """
    Lấy thông tin chi tiết của một món ăn theo ID
    """
    return MenuService.get_food_item(food_id)

@router.post("/check-availability", response_model=Dict[str, bool])
def check_food_availability(food_ids: List[str] = Body(...)):
    """
    Kiểm tra tình trạng của nhiều món ăn cùng lúc
    """
    return MenuService.check_food_availability(food_ids)

@router.post("/", response_model=Dict[str, str])
def add_food(item: FoodItem):
    """
    Thêm món ăn mới vào menu
    """
    return MenuService.add_food(item)

@router.put("/{food_id}", response_model=Dict[str, str])
def update_food_status(food_id: str, update_data: FoodStatusUpdate):
    """
    Cập nhật trạng thái món ăn (available/unavailable)
    """
    return MenuService.update_food_status(food_id, update_data)
