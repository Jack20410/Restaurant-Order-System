from fastapi import APIRouter
from typing import Dict, Any, List
from models import FoodItem, FoodStatusUpdate
from services.menu_service import MenuService

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
def view_menu():
    """
    Lấy danh sách tất cả các món ăn trong menu
    """
    return MenuService.view_menu()

@router.get("/category/{category}", response_model=List[Dict[str, Any]])
def view_menu_by_category(category: str):
    """
    Lấy danh sách món ăn theo category
    Các category có sẵn: SoupBase, SignatureFood, SideDish, Meat, Beverages&Desserts
    """
    return MenuService.view_menu_by_category(category)

@router.get("/{food_id}", response_model=Dict[str, Any])
def view_food_by_id(food_id: str):
    """
    Lấy thông tin chi tiết của một món ăn cụ thể
    """
    return MenuService.view_food_by_id(food_id)

@router.post("/", response_model=Dict[str, str])
def add_food(item: FoodItem):
    """
    Thêm món ăn mới vào menu
    """
    return MenuService.add_food(item)

@router.patch("/{food_id}/availability", response_model=Dict[str, str])
def change_menu_availability(food_id: str, update_data: FoodStatusUpdate):
    """
    Cập nhật trạng thái availability của món ăn (true/false)
    """
    return MenuService.change_menu_availability(food_id, update_data)
