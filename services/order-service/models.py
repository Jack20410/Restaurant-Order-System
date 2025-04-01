from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from database_orders import Base

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    email = Column(String(255), unique=True)
    points = Column(Integer, default=0)

    orders = relationship("Order", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    details = Column(String(255))
    items = Column(String(255))  # JSON string to store items
    total = Column(Float)  # Total amount for the order

    customer = relationship("Customer", back_populates="orders")
    payments = relationship("Payment", back_populates="order")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    amount = Column(Integer)
    payment_method = Column(String(50))  # Payment method (e.g., credit_card)

    order = relationship("Order", back_populates="payments")
