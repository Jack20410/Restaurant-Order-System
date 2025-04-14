# order-service/services/order_service.py
from datetime import datetime
from database_orders import get_db_connection
import json

from datetime import datetime
from database_orders import get_db_connection
from models import Order, OrderItem, Table, OrderCompleted, CompletedOrderMapping
from sqlalchemy.orm import Session
from typing import Dict, Any

def create_order(order_data: Dict[str, Any]):
    session: Session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")

    try:
        # Create order with explicit order_status validation
        order_status = order_data.get("order_status", "pending")
        if order_status not in ['pending', 'preparing', 'ready_to_serve', 'completed', 'cancelled']:
            raise ValueError(f"Invalid order status: {order_status}")

        new_order = Order(
            employee_id=order_data["employee_id"],
            table_id=order_data["table_id"],
            order_status=order_status,
            total_price=order_data["total_price"],
            created_at=datetime.now()
        )
        session.add(new_order)
        session.commit()
        session.refresh(new_order)  # Get ID after insert

        # Add food items to the order
        if "items" in order_data:
            for item in order_data["items"]:
                order_item = OrderItem(
                    order_id=new_order.order_id,
                    food_id=str(item["food_id"]),  # Ensure food_id is string
                    quantity=item["quantity"],
                    note=item.get("note", "")
                )
                session.add(order_item)

        # Update table status
        table = session.query(Table).filter_by(table_id=order_data["table_id"]).first()
        if table:
            table.table_status = "occupied"
        
        session.commit()
        return new_order.order_id

    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()


def update_order_status(order_id: int, status: str):
    """
    Update order status with proper status flow:
    pending -> preparing -> ready_to_serve -> completed
    Any status can go to cancelled
    """
    session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")
    
    try:
        order = session.query(Order).filter(Order.order_id == order_id).first()
        if not order:
            return False

        # Validate status transition
        valid_transitions = {
            'pending': ['preparing', 'cancelled'],
            'preparing': ['ready_to_serve', 'cancelled'],
            'ready_to_serve': ['completed', 'cancelled'],
            'completed': [],  # No transitions from completed
            'cancelled': []   # No transitions from cancelled
        }

        if status not in valid_transitions.get(order.order_status, []):
            raise Exception(f"Invalid status transition from {order.order_status} to {status}")

        # Update order status
        order.order_status = status
        
        # If order is completed or cancelled, update table status if no other active orders
        if status in ['completed', 'cancelled']:
            table = session.query(Table).filter(Table.table_id == order.table_id).first()
            if table:
                # Check if there are any other active orders for this table
                active_orders = session.query(Order).filter(
                    Order.table_id == table.table_id,
                    Order.order_status.in_(['pending', 'preparing', 'ready_to_serve'])
                ).count()
                
                if active_orders == 0:
                    table.table_status = 'available'

        session.commit()
        return True
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def get_order_details(order_id: int):
    session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")
    
    try:
        # Get order with table information
        order = session.query(Order).filter(Order.order_id == order_id).first()
        
        if not order:
            return None

        # Convert to dictionary
        order_dict = {
            "order_id": order.order_id,
            "employee_id": order.employee_id,
            "table_id": order.table_id,
            "order_status": order.order_status,
            "total_price": order.total_price,
            "created_at": order.created_at
        }

        # Get order items
        items = session.query(OrderItem).filter(OrderItem.order_id == order_id).all()
        order_dict['items'] = [{
            "food_id": item.food_id,
            "quantity": item.quantity,
            "note": item.note
        } for item in items]
        
        return order_dict
    finally:
        session.close()


def get_available_tables():
    session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")
    
    try:
        tables = session.query(Table).filter_by(table_status='available').all()
        return [{"table_id": table.table_id, "status": table.table_status} for table in tables]
    finally:
        session.close()

def reserve_table(table_id: int):
    session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")
    
    try:
        table = session.query(Table).filter_by(table_id=table_id).first()
        if table and table.table_status == 'available':
            table.table_status = 'occupied'
            session.commit()
            return True
        return False
    finally:
        session.close()


def create_table(table_data: dict):
    session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")
    
    try:
        new_table = Table(
            table_id=table_data["table_id"],
            table_status=table_data["table_status"]
        )
        session.add(new_table)
        session.commit()
        return {"table_id": new_table.table_id, "status": new_table.table_status}
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def update_table_status(table_id: int, status: str):
    session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")
    
    try:
        table = session.query(Table).filter_by(table_id=table_id).first()
        if table:
            table.table_status = status
            session.commit()
            return True
        return False
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def update_order(order_id: int, order_data: dict):
    session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")
    
    try:
        order = session.query(Order).filter(Order.order_id == order_id).first()
        if not order:
            return False
        if "employee_id" in order_data:
            order.employee_id = order_data["employee_id"]
        if "table_id" in order_data:
            order.table_id = order_data["table_id"]
        if "total_price" in order_data:
            order.total_price = order_data["total_price"]
            
        session.commit()
        return True
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def get_active_orders():
    session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")
    
    try:
        # Get orders that are pending, preparing, or ready to serve
        active_orders = session.query(Order).filter(
            Order.order_status.in_(['pending', 'preparing', 'ready_to_serve'])
        ).order_by(Order.created_at.desc()).all()
        
        # Convert to list of dictionaries with items
        result = []
        for order in active_orders:
            order_dict = {
                "order_id": order.order_id,
                "employee_id": order.employee_id,
                "table_id": order.table_id,
                "order_status": order.order_status,
                "total_price": order.total_price,
                "created_at": order.created_at.isoformat()
            }
            
            # Get items for this order
            items = session.query(OrderItem).filter(OrderItem.order_id == order.order_id).all()
            order_dict['items'] = [{
                "food_id": item.food_id,
                "quantity": item.quantity,
                "note": item.note
            } for item in items]
            
            # Get table information
            table = session.query(Table).filter(Table.table_id == order.table_id).first()
            if table:
                order_dict['table_status'] = table.table_status
            
            result.append(order_dict)
            
        return result
    except Exception as e:
        raise e
    finally:
        session.close()

def migrate_to_completed_order(order_id: int, payment_data: dict):
    """
    Migrate an order to completed_orders table with payment information
    If payment_data contains combined_orders, it will combine multiple orders into one completed order
    """
    session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")
    
    try:
        # Get the main order
        order = session.query(Order).filter(Order.order_id == order_id).first()
        if not order:
            raise Exception(f"Order {order_id} not found")

        # Create completed order
        completed_order = OrderCompleted(
            employee_id=order.employee_id,
            customer_name=payment_data["customer_name"],
            customer_phone=payment_data["customer_phone"],
            table_id=order.table_id,
            total_price=payment_data["amount_paid"],
            completed_at=datetime.now()
        )
        session.add(completed_order)
        session.flush()  # Get the ID without committing

        # Get all order IDs that are being combined
        order_ids = payment_data.get("combined_orders", [order_id])
        
        # Create mappings for all original orders
        for original_order_id in order_ids:
            mapping = CompletedOrderMapping(
                completed_order_id=completed_order.order_completed_id,
                original_order_id=original_order_id
            )
            session.add(mapping)

        # If this is a combined order, get items from all orders
        if "combined_orders" in payment_data:
            all_orders = session.query(Order).filter(
                Order.order_id.in_(payment_data["combined_orders"])
            ).all()
            
            # Copy items from all orders
            for source_order in all_orders:
                for item in source_order.items:
                    # Create new order item linked to completed order
                    completed_item = OrderItem(
                        order_id=completed_order.order_completed_id,
                        food_id=item.food_id,
                        quantity=item.quantity,
                        note=item.note
                    )
                    session.add(completed_item)
        else:
            # Copy items from single order
            for item in order.items:
                completed_item = OrderItem(
                    order_id=completed_order.order_completed_id,
                    food_id=item.food_id,
                    quantity=item.quantity,
                    note=item.note
                )
                session.add(completed_item)

        session.commit()
        return completed_order.order_completed_id
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()