from typing import Dict, Any, List
from fastapi import HTTPException
from models import food_menu, FoodItem, FoodStatusUpdate
from .message_publisher import publisher

class MenuService:
    @staticmethod
    def get_menu() -> List[Dict[str, Any]]:
        """
        Lấy danh sách tất cả các món ăn trong menu
        """
        menu_items = list(food_menu.find({}, {"_id": 0}))
        # Publish menu data to RabbitMQ
        publisher.publish_menu_updated(menu_items)
        return menu_items

    @staticmethod
    def get_food_item(food_id: str) -> Dict[str, Any]:
        """
        Lấy thông tin chi tiết của một món ăn theo ID
        """
        food = food_menu.find_one({"food_id": food_id}, {"_id": 0})
        if not food:
            raise HTTPException(status_code=404, detail="Không tìm thấy món ăn")
        return food

    @staticmethod
    def check_food_availability(food_ids: List[str]) -> Dict[str, bool]:
        """
        Kiểm tra tình trạng của nhiều món ăn cùng lúc
        """
        result = {}
        for food_id in food_ids:
            food = food_menu.find_one({"food_id": food_id}, {"_id": 0, "availability": 1})
            if food and food.get("availability") == "available":
                result[food_id] = True
            else:
                result[food_id] = False
        return result

    @staticmethod
    def add_food(item: FoodItem) -> Dict[str, str]:
        """
        Thêm món ăn mới vào menu
        """
        food_data = item.dict()
        if food_menu.find_one({"name": food_data["name"]}):
            raise HTTPException(status_code=400, detail="Món ăn đã tồn tại")
        
        food_menu.insert_one(food_data)
        
        # Publish event about new menu item
        publisher.publish_menu_item_added(food_data)
        
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
        
        # Publish event about menu item status change
        publisher.publish_menu_item_status_changed(food_id, update_data.availability)
        
        return {"message": "Đã cập nhật trạng thái món ăn"}
