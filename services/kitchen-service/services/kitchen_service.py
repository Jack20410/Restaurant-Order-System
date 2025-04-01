from typing import Dict, Any, List
from datetime import datetime
from fastapi import HTTPException
from models import kitchen_orders, KitchenOrder, OrderStatusUpdate

class KitchenService:
    @staticmethod
    def create_kitchen_order(order: KitchenOrder) -> Dict[str, Any]:
        """
        Nhận đơn hàng mới từ Order Service
        """
        order_data = order.dict()
        order_data["created_at"] = datetime.utcnow()
        
        result = kitchen_orders.insert_one(order_data)
        return {
            "message": "Đã nhận đơn hàng",
            "order_id": str(result.inserted_id),
            "status": order_data["status"]
        }

    @staticmethod
    def update_order_status(order_id: str, update_data: OrderStatusUpdate) -> Dict[str, str]:
        """
        Cập nhật trạng thái đơn hàng
        """
        result = kitchen_orders.update_one(
            {"order_id": order_id},
            {"$set": {
                "status": update_data.status,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
        
        return {"message": f"Đã cập nhật trạng thái đơn hàng thành {update_data.status}"}

    @staticmethod
    def get_all_kitchen_orders() -> List[Dict[str, Any]]:
        """
        Lấy danh sách tất cả các đơn hàng
        """
        return list(kitchen_orders.find({}, {"_id": 0}))

    @staticmethod
    def get_kitchen_order(order_id: str) -> Dict[str, Any]:
        """
        Lấy thông tin chi tiết của một đơn hàng cụ thể
        """
        order = kitchen_orders.find_one({"order_id": order_id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
        return order
