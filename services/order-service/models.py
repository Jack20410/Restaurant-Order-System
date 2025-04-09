from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, Text
from sqlalchemy.orm import relationship
from database_orders import Base
from datetime import datetime

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    email = Column(String(255), unique=True)
    points = Column(Integer, default=0)
    orders = relationship("Order", back_populates="customer")

class Table(Base):
    __tablename__ = "tables"
    table_id = Column(Integer, primary_key=True, index=True)
    table_status = Column(String(50), default="available")  # Make sure it's defined as String
    orders = relationship("Order", back_populates="table")

class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    employee_id = Column(Integer)
    table_id = Column(Integer, ForeignKey("tables.table_id"))
    order_status = Column(Enum('pending', 'processing', 'completed', 'cancelled'))
    total_price = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    table = relationship("Table", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    payment = relationship("Payment", back_populates="order")
    customer = relationship("Customer", back_populates="orders")


class OrderItem(Base):
    __tablename__ = "order_items"
    order_item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    food_id = Column(Integer)
    quantity = Column(Integer)
    note = Column(Text)
    
    order = relationship("Order", back_populates="items")

class Payment(Base):
    __tablename__ = "payments"
    payment_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    customer_id = Column(Integer)
    amount = Column(Float)
    payment_type = Column(Enum('cash', 'card', 'e-wallet'))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("Order", back_populates="payment")
