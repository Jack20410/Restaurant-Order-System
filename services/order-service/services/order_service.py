# order-service/services/order_service.py
from datetime import datetime
from database_orders import get_db_connection
import json

from datetime import datetime
from database_orders import get_db_connection
from models import Order, OrderItem, Table
from sqlalchemy.orm import Session

def create_order(order_data: dict):
    session: Session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")

    try:
        # Tạo đơn hàng
        new_order = Order(
            customer_id=order_data["customer_id"],
            employee_id=order_data["employee_id"],
            table_id=order_data["table_id"],
            order_status="pending",  # Trạng thái mặc định
            total_price=order_data["total_price"],
            created_at=datetime.now()
        )
        session.add(new_order)
        session.commit()
        session.refresh(new_order)  # Lấy ID sau khi insert

        # Thêm các món ăn vào đơn hàng
        if "items" in order_data:
            for item in order_data["items"]:
                order_item = OrderItem(
                    order_id=new_order.order_id,
                    food_id=item["food_id"],
                    quantity=item["quantity"],
                    note=item.get("note", "")
                )
                session.add(order_item)

        # Cập nhật trạng thái bàn ăn
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
    session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")
    
    try:
        order = session.query(Order).filter(Order.order_id == order_id).first()
        if order:
            order.order_status = status
            session.commit()
            return True
        return False
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
            "customer_id": order.customer_id,
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


def create_table():
    session = get_db_connection()
    if not session:
        raise Exception("Database connection failed")
    
    try:
        new_table = Table(
            table_status='available'
        )
        session.add(new_table)
        session.commit()
        return {"table_id": new_table.table_id, "status": new_table.table_status}
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()