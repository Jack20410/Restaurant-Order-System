from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, Text
from sqlalchemy.orm import relationship
from database_orders import Base
from datetime import datetime

class Table(Base):
    __tablename__ = "tables"
    table_id = Column(Integer, primary_key=True, index=True)
    table_status = Column(Enum('available', 'occupied', 'reserved'), default='available')
    orders = relationship("Order", back_populates="table")

class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, index=True)  # Reference to user-service employee
    table_id = Column(Integer, ForeignKey("tables.table_id"))
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    order_status = Column(Enum('pending', 'preparing', 'ready_to_serve', 'completed', 'cancelled', 'paid'))
    total_price = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    table = relationship("Table", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", foreign_keys="OrderItem.order_id", cascade="all, delete-orphan")

class OrderCompleted(Base):
    __tablename__ = "orders_completed"
    order_completed_id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer)  # Reference to user-service employee
    customer_name = Column(String(100))
    customer_phone = Column(String(20))
    table_id = Column(Integer, ForeignKey("tables.table_id"))
    total_price = Column(Float)
    completed_at = Column(DateTime, default=datetime.utcnow)

    table = relationship("Table")
    items = relationship("CompletedOrderItem", back_populates="order_completed")
    payment = relationship("Payment", back_populates="order_completed")
    original_orders = relationship("CompletedOrderMapping", back_populates="completed_order")

class CompletedOrderMapping(Base):
    __tablename__ = "completed_order_mappings"
    id = Column(Integer, primary_key=True, index=True)
    completed_order_id = Column(Integer, ForeignKey("orders_completed.order_completed_id"))
    original_order_id = Column(Integer)
    
    completed_order = relationship("OrderCompleted", back_populates="original_orders")

class CompletedOrderItem(Base):
    __tablename__ = "completed_order_items"
    completed_order_item_id = Column(Integer, primary_key=True, index=True)
    order_completed_id = Column(Integer, ForeignKey("orders_completed.order_completed_id"))
    food_id = Column(String(10))
    quantity = Column(Integer)
    note = Column(Text)
    
    order_completed = relationship("OrderCompleted", back_populates="items")

class OrderItem(Base):
    __tablename__ = "order_items"
    order_item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))  # This can reference either orders.order_id or orders_completed.order_completed_id
    food_id = Column(String(10))
    quantity = Column(Integer)
    note = Column(Text)
    
    order = relationship("Order", back_populates="items", foreign_keys=[order_id])

class Payment(Base):
    __tablename__ = "payments"
    payment_id = Column(Integer, primary_key=True, index=True)
    order_completed_id = Column(Integer, ForeignKey("orders_completed.order_completed_id"))
    payment_method = Column(Enum('cash', 'card', 'e-wallet'))
    payment_status = Column(Enum('pending', 'completed', 'failed'))
    amount_paid = Column(Float)
    payment_date = Column(DateTime, default=datetime.utcnow)
    transaction_id = Column(String(100), nullable=True)  # For card/e-wallet payments

    order_completed = relationship("OrderCompleted", back_populates="payment")
