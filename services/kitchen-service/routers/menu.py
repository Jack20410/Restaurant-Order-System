from fastapi import APIRouter
from typing import Dict, Any, List
from models import FoodItem, FoodStatusUpdate, BatchFoodStatusUpdate
from services.menu_service import MenuService
from fastapi import File, UploadFile, Form

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
def view_menu():
    """
    Lấy danh sách tất cả các món ăn trong menu
    """
    return MenuService.view_menu()

@router.get("/available", response_model=List[Dict[str, Any]])
def view_available_menu():
    """
    Lấy danh sách các món ăn hiện có sẵn (availability = true)
    """
    return MenuService.view_menu_by_availability(True)

@router.get("/unavailable", response_model=List[Dict[str, Any]])
def view_unavailable_menu():
    """
    Lấy danh sách các món ăn hiện không có sẵn (availability = false)
    """
    return MenuService.view_menu_by_availability(False)

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
async def add_food(item: FoodItem):
    """
    Thêm món ăn mới vào menu
    """
    return MenuService.add_food(item)

@router.patch("/{food_id}/availability", response_model=Dict[str, str])
async def change_menu_availability(food_id: str, update_data: FoodStatusUpdate):
    """
    Cập nhật trạng thái availability của món ăn (true/false)
    """
    return MenuService.change_menu_availability(food_id, update_data)

@router.patch("/batch-update", response_model=Dict[str, Any])
async def batch_update_availability(update_data: BatchFoodStatusUpdate):
    """
    Cập nhật trạng thái availability cho nhiều món ăn cùng lúc
    Body JSON format: {"food_ids": ["id1", "id2", ...], "availability": true/false}
    """
    return MenuService.batch_update_availability(update_data)

@router.delete("/{food_id}", response_model=Dict[str, str])
async def delete_food(food_id: str):
    """
    Xóa món ăn khỏi menu
    """
    return MenuService.delete_food(food_id)

@router.post("/upload-image", response_model=Dict[str, str])
async def upload_food_image(
    file: UploadFile = File(...),
    category: str = Form(...)
):
    """
    Upload hình ảnh món ăn và lưu vào thư mục tương ứng với category
    """
    return await MenuService.upload_image(file, category)
