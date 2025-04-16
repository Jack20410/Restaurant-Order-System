# order-service/services/payment_service.py
from datetime import datetime  # This import is missing
from ..database import get_db_connection

def create_payment(payment_data: dict):
    connection = get_db_connection()
    if not connection:
        raise Exception("Database connection failed")
    
    try:
        cursor = connection.cursor()
        query = """
        INSERT INTO payments (
            order_id, table_id, waiter_id, amount, 
            payment_type, created_at, customer_name, 
            customer_age, customer_number, has_membership, 
            membership_id
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            payment_data["order_id"],
            payment_data["table_id"],
            payment_data["waiter_id"],
            payment_data["amount"],
            payment_data["payment_type"],
            datetime.now(),
            payment_data.get("customer_name"),
            payment_data.get("customer_age"),
            payment_data.get("customer_number"),
            payment_data.get("has_membership", 0),
            payment_data.get("membership_id")
        )
        cursor.execute(query, values)
        connection.commit()
        payment_id = cursor.lastrowid

        # Update order status to completed after payment
        update_query = "UPDATE orders SET order_status = 'completed' WHERE order_id = %s"
        cursor.execute(update_query, (payment_data["order_id"],))
        connection.commit()

        return payment_id
    finally:
        connection.close()

def get_payment(payment_id: int):
    connection = get_db_connection()
    if not connection:
        raise Exception("Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = """
        SELECT p.*, o.total_price, o.order_status
        FROM payments p
        JOIN orders o ON p.order_id = o.order_id
        WHERE p.payment_id = %s
        """
        cursor.execute(query, (payment_id,))
        return cursor.fetchone()
    finally:
        connection.close()