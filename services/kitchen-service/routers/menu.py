from fastapi import APIRouter
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
