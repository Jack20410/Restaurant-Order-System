from sqlalchemy.orm import Session
import database

def create_customer(db: Session, customer_data: dict):
    try:
        cursor = db.execute(
            """
            INSERT INTO customers (name, phone, customer_type, points)
            VALUES (:name, :phone, :customer_type, :points)
            """,
            {
                "name": customer_data["name"],
                "phone": customer_data["phone"],
                "customer_type": customer_data["customer_type"],
                "points": customer_data["points"]
            }
        )
        db.commit()
        return cursor.lastrowid
    except Exception as e:
        db.rollback()
        raise e

def get_customer(db: Session, customer_id: int):
    result = db.execute(
        "SELECT * FROM customers WHERE customer_id = :customer_id",
        {"customer_id": customer_id}
    ).fetchone()
    
    if result:
        return dict(result)
    return None

def update_customer(db: Session, customer_id: int, update_data: dict):
    try:
        result = db.execute(
            "UPDATE customers SET points = :points WHERE customer_id = :customer_id",
            {
                "points": update_data["points"],
                "customer_id": customer_id
            }
        )
        db.commit()
        return result.rowcount > 0
    except Exception as e:
        db.rollback()
        raise e 