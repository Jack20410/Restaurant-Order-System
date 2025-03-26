from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from models import Base

DATABASE_URL = "mysql+pymysql://root:@localhost/restaurant_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
metadata = MetaData()

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)

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

if __name__ == "__main__":
    test_connection()
