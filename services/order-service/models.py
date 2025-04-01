from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False)
    waiter_id = Column(Integer, nullable=False)
    table_id = Column(Integer, nullable=False)
    food_id = Column(Integer, nullable=False)
    status = Column(String(20), default="pending")
    total_price = Column(Float, nullable=False)

class Payment(Base):
    __tablename__ = "payments"
    payment_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    payment_type = Column(String(20), nullable=False)
