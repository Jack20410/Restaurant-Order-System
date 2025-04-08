from typing import Dict, Any, List
from fastapi import HTTPException
from models import FoodItem, FoodStatusUpdate, BatchFoodStatusUpdate, get_food_menu

class MenuService:
    @staticmethod
    def view_menu() -> List[Dict[str, Any]]:
        """
        Lấy danh sách tất cả các món ăn trong menu
        """
        food_menu = get_food_menu()
        return list(food_menu.find({}, {"_id": 0}).sort("category", 1))

    @staticmethod
    def view_menu_by_availability(available: bool) -> List[Dict[str, Any]]:
        """
        Lấy danh sách các món ăn dựa trên tình trạng availability
        """
        food_menu = get_food_menu()
        menu_items = list(food_menu.find({"availability": available}, {"_id": 0}).sort("category", 1))
        return menu_items

    @staticmethod
    def view_menu_by_category(category: str) -> List[Dict[str, Any]]:
        """
        Lấy danh sách món ăn theo category
        """
        food_menu = get_food_menu()
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
        food_menu = get_food_menu()
        food_item = food_menu.find_one({"food_id": food_id}, {"_id": 0})
        if not food_item:
            raise HTTPException(
                status_code=404,
                detail=f"Không tìm thấy món ăn với food_id: {food_id}"
            )
        return food_item

    @staticmethod
    def add_food(item: FoodItem) -> Dict[str, str]:
        """
        Thêm món ăn mới vào menu
        """
        food_menu = get_food_menu()
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
        food_menu = get_food_menu()
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

    @staticmethod
    def batch_update_availability(update_data: BatchFoodStatusUpdate) -> Dict[str, Any]:
        """
        Cập nhật trạng thái availability cho nhiều món ăn cùng lúc
        """
        food_menu = get_food_menu()
        # Kiểm tra danh sách món ăn có tồn tại không
        food_ids = update_data.food_ids
        existing_foods = list(food_menu.find({"food_id": {"$in": food_ids}}, {"food_id": 1, "name": 1}))
        
        if not existing_foods:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy món ăn nào trong danh sách đã cung cấp"
            )
        
        # Lấy danh sách food_id đã tìm thấy
        found_food_ids = [food["food_id"] for food in existing_foods]
        
        # Cập nhật trạng thái cho các món ăn
        result = food_menu.update_many(
            {"food_id": {"$in": found_food_ids}},
            {"$set": {"availability": update_data.availability}}
        )
        
        # Tính toán các food_id không tìm thấy
        not_found_food_ids = [food_id for food_id in food_ids if food_id not in found_food_ids]
        
        # Trả về thông báo phù hợp
        status = "có sẵn" if update_data.availability else "hết hàng"
        updated_count = result.modified_count
        
        return {
            "message": f"Đã cập nhật {updated_count} món ăn thành {status}",
            "updated_count": updated_count,
            "not_found": not_found_food_ids
        }
