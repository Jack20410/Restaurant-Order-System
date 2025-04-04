from typing import Dict, Any, List
from fastapi import HTTPException
from models import food_menu, FoodItem, FoodStatusUpdate

class MenuService:
    @staticmethod
    def view_menu() -> List[Dict[str, Any]]:
        """
        Lấy danh sách tất cả các món ăn trong menu
        """
        return list(food_menu.find({}, {"_id": 0}).sort("category", 1))

    @staticmethod
    def view_menu_by_category(category: str) -> List[Dict[str, Any]]:
        """
        Lấy danh sách món ăn theo category
        """
        valid_categories = ["SoupBase", "SignatureFood", "SideDish", "Meat", "Beverages&Desserts"]
        if category not in valid_categories:
            raise HTTPException(
                status_code=400, 
                detail=f"Category không hợp lệ. Các category có sẵn: {', '.join(valid_categories)}"
            )
            
        menu_items = list(food_menu.find({"category": category}, {"_id": 0}))
        if not menu_items:
            raise HTTPException(
                status_code=404,
                detail=f"Không tìm thấy món ăn nào trong category {category}"
            )
        return menu_items
    
    @staticmethod
    def view_food_by_id(food_id: str) -> Dict[str, Any]:
        """
        Lấy thông tin chi tiết của một món ăn cụ thể
        """
        food_item = food_menu.find_one({"food_id": food_id}, {"_id": 0})
        return food_item

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
    def change_menu_availability(food_id: str, update_data: FoodStatusUpdate) -> Dict[str, str]:
        """
        Cập nhật trạng thái availability của món ăn
        """
        # Kiểm tra món ăn có tồn tại không
        food = food_menu.find_one({"food_id": food_id})
        if not food:
            raise HTTPException(
                status_code=404,
                detail=f"Không tìm thấy món ăn với food_id: {food_id}"
            )

        # Cập nhật trạng thái
        result = food_menu.update_one(
            {"food_id": food_id}, 
            {"$set": {"availability": update_data.availability}}
        )
        
        # Trả về thông báo phù hợp
        status = "có sẵn" if update_data.availability else "hết hàng"
        return {"message": f"Đã cập nhật món ăn {food['name']} thành {status}"}
