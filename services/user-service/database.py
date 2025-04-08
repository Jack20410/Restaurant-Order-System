from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from models import Base
import os

# Get database URL from environment variable with fallback
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://user:password@user-db:3306/user_db"
)

# Ensure the URL uses the correct format for SQLAlchemy
if DATABASE_URL.startswith('mysql://'):
    DATABASE_URL = DATABASE_URL.replace('mysql://', 'mysql+pymysql://', 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
metadata = MetaData()

def init_db():
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Successfully initialized database tables!")
    except Exception as e:
        print(f"❌ Failed to initialize database tables: {str(e)}")
        raise e

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
    if test_connection():
        init_db()
