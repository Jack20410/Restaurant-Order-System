from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "mysql+pymysql://root:@localhost/restaurant_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db_connection():
    try:
        db = SessionLocal()
        return db
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None


def init_db():
    from models import Customer, Order, Payment, Table, OrderItem
    Base.metadata.create_all(bind=engine)
