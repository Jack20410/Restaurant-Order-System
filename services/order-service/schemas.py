from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

class OrderItemCreate(BaseModel):
    food_id: str
    quantity: int
    note: Optional[str] = None

class OrderCreate(BaseModel):
    employee_id: int
    table_id: int
    order_status: Literal['pending', 'preparing', 'ready_to_serve', 'completed', 'cancelled'] = 'pending'
    total_price: float
    items: List[OrderItemCreate]

class OrderItem(OrderItemCreate):
    order_item_id: int
    order_id: int

    class Config:
        orm_mode = True

class Order(OrderCreate):
    order_id: int
    order_status: str
    created_at: datetime
    items: List[OrderItem]

    class Config:
        orm_mode = True

class OrderResponse(BaseModel):
    order_id: int
    employee_id: int
    table_id: int
    order_status: str
    total_price: float
    created_at: datetime

class PaymentCreate(BaseModel):
    order_id: int
    amount: float
    payment_type: str
    
class PaymentResponse(BaseModel):
    payment_id: int
    order_id: int
    amount: float
    payment_type: str
    created_at: datetime

class ReceiptSummary(BaseModel):
    total_receipts: int
    total_amount: float
    total_orders: int

class ReceiptDetail(BaseModel):
    payment_id: int
    order_id: int
    amount: float
    payment_type: str
    created_at: datetime
    total_price: float

class ShiftReport(BaseModel):
    summary: ReceiptSummary
    receipts: List[ReceiptDetail]
    shift_date: str
    employee_id: int

class PaymentTypeBreakdown(BaseModel):
    payment_type: str
    count: int
    total: float

class EmployeePerformance(BaseModel):
    employee_id: int
    receipt_count: int
    total_amount: float

class DailyReceipts(BaseModel):
    date: str
    summary: ReceiptSummary
    payment_types: List[PaymentTypeBreakdown]
    employees: List[EmployeePerformance]

class DailySummary(BaseModel):
    day: datetime
    receipt_count: int
    daily_total: float

class MonthlyReceipts(BaseModel):
    year: int
    month: int
    summary: ReceiptSummary
    daily_breakdown: List[DailySummary]

class MonthlySummary(BaseModel):
    month: int
    receipt_count: int
    monthly_total: float

class YearlyReceipts(BaseModel):
    year: int
    summary: ReceiptSummary
    monthly_breakdown: List[MonthlySummary]