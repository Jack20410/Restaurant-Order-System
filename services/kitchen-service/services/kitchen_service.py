from typing import Dict, Any, List
from datetime import datetime
from fastapi import HTTPException
from models import KitchenOrder, OrderStatus, OrderServeUpdate, OrderStatusUpdate, get_kitchen_orders

class KitchenService:
    @staticmethod
    def add_kitchen_order(order: KitchenOrder) -> Dict[str, str]:
        """
        Thêm đơn hàng mới vào danh sách đơn hàng của bếp
        """
        kitchen_orders = get_kitchen_orders()
        order_data = order.dict()
        
        # Kiểm tra xem đơn hàng đã tồn tại chưa
        if kitchen_orders.find_one({"order_id": order_data["order_id"]}):
            raise HTTPException(status_code=400, detail="Đơn hàng đã tồn tại")
        
        kitchen_orders.insert_one(order_data)
        return {"message": "Đã thêm đơn hàng mới vào danh sách bếp"}

    @staticmethod
    def update_order_status(order_id: str, update_data: OrderStatusUpdate) -> Dict[str, str]:
        """
        Cập nhật trạng thái của đơn hàng
        """
        kitchen_orders = get_kitchen_orders()
        # Kiểm tra đơn hàng có tồn tại không
        order = kitchen_orders.find_one({"order_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

        # Cập nhật trạng thái
        result = kitchen_orders.update_one(
            {"order_id": order_id},
            {"$set": {"status": update_data.status}}
        )

        return {"message": f"Đã cập nhật trạng thái đơn hàng thành {update_data.status}"}

    @staticmethod
    def mark_items_served(order_id: str, update_data: OrderServeUpdate) -> Dict[str, Any]:
        """
        Đánh dấu các món ăn đã được phục vụ trong đơn hàng
        """
        kitchen_orders = get_kitchen_orders()
        # Kiểm tra đơn hàng có tồn tại không
        order = kitchen_orders.find_one({"order_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

        # Kiểm tra các chỉ số món ăn có hợp lệ không
        if any(idx < 0 or idx >= len(order["items"]) for idx in update_data.item_indices):
            raise HTTPException(status_code=400, detail="Chỉ số món ăn không hợp lệ")

        # Cập nhật trạng thái served cho các món ăn
        update_fields = {}
        for idx in update_data.item_indices:
            update_fields[f"items.{idx}.is_served"] = True

        # Cập nhật trong database
        kitchen_orders.update_one(
            {"order_id": order_id},
            {"$set": update_fields}
        )

        # Kiểm tra xem tất cả các món đã được phục vụ chưa
        updated_order = kitchen_orders.find_one({"order_id": order_id})
        all_served = all(item["is_served"] for item in updated_order["items"])

        # Nếu tất cả món đã được phục vụ, cập nhật trạng thái đơn hàng thành COMPLETED
        if all_served:
            update_fields["status"] = OrderStatus.COMPLETED
            kitchen_orders.update_one(
                {"order_id": order_id},
                {"$set": {"status": OrderStatus.COMPLETED}}
            )

        served_count = len(update_data.item_indices)
        return {
            "message": f"Đã đánh dấu {served_count} món ăn là đã phục vụ",
            "order_id": order_id,
            "all_served": all_served,
            "status": update_fields.get("status", order["status"])
        }

    @staticmethod
    def get_all_kitchen_orders() -> List[Dict[str, Any]]:
        """
        Lấy danh sách tất cả các đơn hàng
        """
        kitchen_orders = get_kitchen_orders()
        return list(kitchen_orders.find({}, {"_id": 0}))

    @staticmethod
    def get_kitchen_order(order_id: str) -> Dict[str, Any]:
        """
        Lấy thông tin chi tiết của một đơn hàng cụ thể
        """
        kitchen_orders = get_kitchen_orders()
        order = kitchen_orders.find_one({"order_id": order_id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
        return order
    
    @staticmethod
    def get_ready_to_serve_orders() -> List[Dict[str, Any]]:
        """
        Lấy danh sách các đơn hàng đã sẵn sàng để phục vụ (status = ready)
        nhưng chưa được đánh dấu là đã phục vụ hoàn toàn
        """
        kitchen_orders = get_kitchen_orders()
        query = {
            "status": OrderStatus.READY.value,
            "items": {"$elemMatch": {"is_served": False}}
        }
        return list(kitchen_orders.find(query, {"_id": 0}))
    
    @staticmethod
    def get_partially_served_orders() -> List[Dict[str, Any]]:
        """
        Lấy danh sách các đơn hàng đã được phục vụ một phần
        (có ít nhất một món đã phục vụ và ít nhất một món chưa phục vụ)
        """
        pipeline = [
            {
                "$match": {
                    "status": {"$in": [OrderStatus.READY.value, OrderStatus.PREPARING.value]},
                }
            },
            {
                "$addFields": {
                    "served_count": {
                        "$size": {
                            "$filter": {
                                "input": "$items",
                                "as": "item",
                                "cond": {"$eq": ["$$item.is_served", True]}
                            }
                        }
                    },
                    "total_items": {"$size": "$items"}
                }
            },
            {
                "$match": {
                    "served_count": {"$gt": 0},
                    "$expr": {"$lt": ["$served_count", "$total_items"]}
                }
            },
            {
                "$project": {
                    "_id": 0
                }
            }
        ]
        
        return list(kitchen_orders.aggregate(pipeline))
