from typing import Dict, Any, List
from fastapi import HTTPException
from models import food_menu, FoodItem, FoodStatusUpdate

class MenuService:
    @staticmethod
    def get_menu() -> List[Dict[str, Any]]:
        """
        Lấy danh sách tất cả các món ăn trong menu
        """
        return list(food_menu.find({}, {"_id": 0}))

    @staticmethod
    def add_food(item: FoodItem) -> Dict[str, str]:
        """
        Thêm món ăn mới vào menu
        """
        food_data = item.dict()
        if food_menu.find_one({"name": food_data["name"]}):
            raise HTTPException(status_code=400, detail="Món ăn đã tồn tại")
        food_menu.insert_one(food_data)
        return {"message": "Đã thêm món ăn mới"}

    @staticmethod
    def update_food_status(food_id: str, update_data: FoodStatusUpdate) -> Dict[str, str]:
        """
        Cập nhật trạng thái món ăn (available/unavailable)
        """
        result = food_menu.update_one(
            {"food_id": food_id}, 
            {"$set": {"availability": update_data.availability}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy món ăn")
        return {"message": "Đã cập nhật trạng thái món ăn"}
