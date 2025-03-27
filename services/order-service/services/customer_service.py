# order-service/services/customer_service.py
from ..database import get_db_connection

def create_customer(customer_data: dict):
    connection = get_db_connection()
    if not connection:
        raise Exception("Database connection failed")
    
    try:
        cursor = connection.cursor()
        query = """
        INSERT INTO customers (name, phone, customer_type, points)
        VALUES (%s, %s, %s, %s)
        """
        values = (
            customer_data["name"],
            customer_data["phone"],
            customer_data["customer_type"],
            customer_data["points"]
        )
        cursor.execute(query, values)
        connection.commit()
        customer_id = cursor.lastrowid
        return customer_id
    finally:
        connection.close()

def get_customer(customer_id: int):
    connection = get_db_connection()
    if not connection:
        raise Exception("Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = "SELECT * FROM customers WHERE customer_id = %s"
        cursor.execute(query, (customer_id,))
        customer = cursor.fetchone()
        return customer
    finally:
        connection.close()

def update_customer(customer_id: int, update_data: dict):
    connection = get_db_connection()
    if not connection:
        raise Exception("Database connection failed")
    
    try:
        cursor = connection.cursor()
        query = "UPDATE customers SET points = %s WHERE customer_id = %s"
        values = (update_data["points"], customer_id)
        cursor.execute(query, values)
        connection.commit()
        return cursor.rowcount > 0
    finally:
        connection.close()