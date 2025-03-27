# order-service/services/order_service.py
from datetime import datetime
from ..database import get_db_connection

def create_order(order_data: dict):
    connection = get_db_connection()
    if not connection:
        raise Exception("Database connection failed")
    
    try:
        cursor = connection.cursor()
        query = """
        INSERT INTO orders (customer_id, waiter_id, table_id, status, total_price, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (
            order_data["customer_id"],
            order_data["waiter_id"],
            order_data["table_id"],
            order_data["status"],
            order_data["total_price"],
            datetime.now()
        )
        cursor.execute(query, values)
        connection.commit()
        order_id = cursor.lastrowid
        return order_id
    finally:
        connection.close()

def update_order(order_id: int, update_data: dict):
    connection = get_db_connection()
    if not connection:
        raise Exception("Database connection failed")
    
    try:
        cursor = connection.cursor()
        query = "UPDATE orders SET status = %s WHERE order_id = %s"
        values = (update_data["status"], order_id)
        cursor.execute(query, values)
        connection.commit()
        return cursor.rowcount > 0
    finally:
        connection.close()