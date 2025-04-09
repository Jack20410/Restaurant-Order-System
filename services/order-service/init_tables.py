from database_orders import SessionLocal, init_db
from models import Table, Order, OrderItem, Payment

def initialize_tables():
    db = SessionLocal()
    try:
        # First, delete related records
        db.query(Payment).delete()
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(Table).delete()
        
        # Create 20 tables
        for i in range(1, 21):
            table = Table(
                table_id=i,
                table_status='available'
            )
            db.add(table)
        
        db.commit()
        print("Tables initialized successfully!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    initialize_tables()