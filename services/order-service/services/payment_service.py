# order-service/services/payment_service.py
from ..database import get_db_connection

def create_payment(payment_data: dict):
    connection = get_db_connection()
    if not connection:
        raise Exception("Database connection failed")
    
    try:
        cursor = connection.cursor()
        query = """
        INSERT INTO payments (order_id, payment_type)
        VALUES (%s, %s)
        """
        values = (payment_data["order_id"], payment_data["payment_type"])
        cursor.execute(query, values)
        connection.commit()
        payment_id = cursor.lastrowid
        return payment_id
    finally:
        connection.close()