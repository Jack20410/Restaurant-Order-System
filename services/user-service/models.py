from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    mail = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # waiter, kitchen, management
    shifts = Column(String(50), nullable=True)

class Customer(Base):
    __tablename__ = "customers"
    customer_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    phone = Column(String(15), nullable=False)
    customer_type = Column(String(10), default="regular")  # "regular" hoặc "loyal"
    points = Column(Float, default=0.0)  # 1000 VNĐ = 1 điểm
