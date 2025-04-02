from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

#DATABASE_URL = "mysql+pymysql://root:@localhost/order_db"
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://user:password@order-db:3306/order_db")

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
    from models import Order, Payment, Table, OrderItem
    Base.metadata.create_all(bind=engine)
