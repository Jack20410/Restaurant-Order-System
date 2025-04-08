from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Get database URL from environment variable with fallback
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://user:password@order-db:3306/order_db"
)

# Ensure the URL uses the correct format for SQLAlchemy
if DATABASE_URL.startswith('mysql://'):
    DATABASE_URL = DATABASE_URL.replace('mysql://', 'mysql+pymysql://', 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db_connection():
    try:
        db = SessionLocal()
        # Test the connection with proper text() function
        db.execute(text("SELECT 1"))
        return db
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return None
    
def test_connection():
    try:
        # Try to connect to the database
        connection = engine.connect()
        connection.close()
        print("✅ Successfully connected to the database!")
        return True
    except Exception as e:
        print(f"❌ Failed to connect to the database: {str(e)}")
        return False

def init_db():
    try:
        from models import Customer, Order, Payment, Table, OrderItem
        Base.metadata.create_all(bind=engine)
        print("✅ Successfully initialized database tables!")
    except Exception as e:
        print(f"❌ Failed to initialize database tables: {str(e)}")
        raise e

if __name__ == "__main__":
    if test_connection():
        init_db()
