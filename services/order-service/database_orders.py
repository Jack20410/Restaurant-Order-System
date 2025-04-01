from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "mysql+pymysql://root:@localhost/restaurant_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Tạo bảng trong database nếu chưa có
def init_db():
    from models import Customer, Order, Payment
    Base.metadata.create_all(bind=engine)  # Ensure new fields are added
