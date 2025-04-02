from typing import Dict, Any, List
from fastapi import HTTPException
import requests
import os
import logging
from .message_consumer import consumer
from .message_publisher import publisher  # If you want to publish order events from kitchen too

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get order service URL from environment or use default
ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://order-service:8000")

class KitchenOrderService:
    @staticmethod
    def get_active_orders(table_id: int = None) -> List[Dict[str, Any]]:
        """
        Get all active orders, optionally filtered by table
        """
        return consumer.get_active_orders(table_id)
    
    @staticmethod
    def get_order(order_id: int) -> Dict[str, Any]:
        """
        Get a specific order by ID
        """
        order = consumer.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order
    
    @staticmethod
    def update_order_status(order_id: int, status: str) -> Dict[str, str]:
        """
        Update the status of an order (preparing, completed, canceled)
        """
        # First check if we have the order
        order = consumer.get_order(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Send request to order service to update status
        try:
            response = requests.put(
                f"{ORDER_SERVICE_URL}/orders/{order_id}/status",
                json={"status": status, "updated_by": "kitchen-service"}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to update order status: {response.text}"
                )
            
            # Order status will be updated in our local cache via the message consumer
            
            return {"message": f"Order status updated to {status}"}
            
        except requests.RequestException as e:
            # Fall back to just updating our local cache
            logger.warning(f"Error communicating with order service: {str(e)}")
            
            # Update local record (although this should happen via message too)
            if order_id in consumer.active_orders:
                consumer.active_orders[order_id]["order_status"] = status
            
            return {"message": f"Order status updated locally to {status}, but failed to update in order service"}
    
    @staticmethod
    def register_order_handlers():
        """
        Register handlers for order events
        """
        def on_order_created(order_data: Dict[str, Any]):
            logger.info(f"Kitchen handling new order {order_data.get('order_id')}")
            # Here you could add additional logic, like:
            # - Send notifications to kitchen staff
            # - Automatically update order status to "preparing" after validation
            # - Calculate estimated preparation time
        
        def on_order_updated(update_data: Dict[str, Any]):
            logger.info(f"Kitchen handling updated order {update_data.get('order_id')} - new status: {update_data.get('new_status')}")
            # Here you could add additional logic, like:
            # - Send notifications based on new status
            # - Trigger other workflows (e.g., notify servers when order is "completed")
        
        # Register our handlers
        consumer.register_order_created_callback(on_order_created)
        consumer.register_order_updated_callback(on_order_updated)
        
        logger.info("Kitchen order handlers registered")

# Initialize service
kitchen_order_service = KitchenOrderService()
kitchen_order_service.register_order_handlers() 