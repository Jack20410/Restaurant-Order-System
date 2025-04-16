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
        from models import Order, Payment, Table, OrderItem, OrderCompleted
        
        connection = engine.connect()
        connection.close()
        print("✅ Successfully connected to the database!")
        
        # Disable foreign key checks before dropping tables
        with engine.connect() as conn:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            
        # Drop and recreate tables
        Base.metadata.drop_all(bind=engine)
        print("Dropped all existing tables")
        Base.metadata.create_all(bind=engine)
        
        # Re-enable foreign key checks
        with engine.connect() as conn:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
        
        # Verify tables were created
        with engine.connect() as conn:
            tables = Base.metadata.tables.keys()
            existing_tables = conn.execute(text("SHOW TABLES")).fetchall()
            existing_tables = [t[0] for t in existing_tables]
            
            print(f"Expected tables: {', '.join(tables)}")
            print(f"Existing tables: {', '.join(existing_tables)}")
            
            if set(tables) == set(existing_tables):
                print("✅ All tables created successfully!")
                
                # Create initial tables
                session = SessionLocal()
                try:
                    print("Creating initial tables...")
                    # Create 10 tables
                    for i in range(1, 11):
                        new_table = Table(table_id=i, table_status='available')
                        session.add(new_table)
                    session.commit()
                    print("✅ Initial tables created successfully!")
                except Exception as e:
                    session.rollback()
                    print(f"❌ Failed to create initial tables: {str(e)}")
                    raise e
                finally:
                    session.close()
            else:
                missing = set(tables) - set(existing_tables)
                if missing:
                    print(f"❌ Missing tables: {', '.join(missing)}")
                    raise Exception(f"Failed to create tables: {', '.join(missing)}")
                
    except Exception as e:
        print(f"❌ Failed to initialize database: {str(e)}")
        raise e

if __name__ == "__main__":
    if test_connection():
        init_db()
