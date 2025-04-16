from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database_orders import SessionLocal
from models import Payment, Order, OrderCompleted, Table
from datetime import datetime
from services.order_service import migrate_to_completed_order
from typing import Optional, Literal, List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class PaymentCreate(BaseModel):
    table_id: int
    phone_number: str
    customer_name: str

class PaymentHistory(BaseModel):
    payment_id: int
    order_completed_id: int
    original_order_ids: List[int]
    amount: float
    payment_date: datetime
    customer_name: str
    customer_phone: str

class OrderItemDetail(BaseModel):
    food_id: str
    quantity: int
    note: Optional[str]

class OrderDetail(BaseModel):
    order_id: int
    items: List[OrderItemDetail]
    subtotal: float

class TableOrderDetails(BaseModel):
    table_id: int
    orders: List[OrderDetail]

class CustomerInfo(BaseModel):
    name: str
    phone: str

class EmployeeInfo(BaseModel):
    employee_id: int

class ReceiptResponse(BaseModel):
    receipt_id: str
    order_details: TableOrderDetails
    customer_info: CustomerInfo
    employee_info: EmployeeInfo
    total_amount: float
    payment_date: datetime

@router.post("/", response_model=PaymentHistory)
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    try:
        # 1. Get all pending/preparing/ready_to_serve orders for the table
        orders = db.query(Order).filter(
            Order.table_id == payment.table_id,
            Order.order_status.in_(['pending', 'preparing', 'ready_to_serve', 'completed'])
        ).all()
        
        if not orders:
            raise HTTPException(
                status_code=404, 
                detail="No active orders found for this table"
            )

        # Update customer information and status for all orders
        for order in orders:
            order.customer_name = payment.customer_name
            order.customer_phone = payment.phone_number
            order.order_status = 'paid'

        # Calculate total amount for all orders
        total_amount = sum(order.total_price for order in orders)

        # 2. Create a single completed order that combines all orders
        first_order = orders[0]
        order_ids = [order.order_id for order in orders]
        combined_order_data = {
            "customer_name": payment.customer_name,
            "customer_phone": payment.phone_number,
            "amount_paid": total_amount,
            "combined_orders": order_ids
        }
        
        completed_order_id = migrate_to_completed_order(
            first_order.order_id,
            combined_order_data
        )
        
        # Create a single payment record for all orders
        new_payment = Payment(
            order_completed_id=completed_order_id,
            payment_status='completed',
            amount_paid=total_amount,
            payment_date=datetime.now()
        )
        
        db.add(new_payment)
        db.commit()
        
        # Get the completed order and its mappings for response
        completed_order = db.query(OrderCompleted).filter(
            OrderCompleted.order_completed_id == completed_order_id
        ).first()

        # Get original order IDs from mapping
        original_order_ids = [
            mapping.original_order_id 
            for mapping in completed_order.original_orders
        ]

        return PaymentHistory(
            payment_id=new_payment.payment_id,
            order_completed_id=completed_order_id,
            original_order_ids=original_order_ids,
            amount=total_amount,
            payment_date=new_payment.payment_date,
            customer_name=completed_order.customer_name,
            customer_phone=completed_order.customer_phone
        )
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

def get_completed_orders_by_phone(phone_number: str, db: Session):
    """Helper function to get completed orders by phone number"""
    return db.query(OrderCompleted).filter(
        OrderCompleted.customer_phone == phone_number
    ).order_by(OrderCompleted.completed_at.desc()).all()

def get_payment_for_completed_order(completed_order: OrderCompleted, db: Session):
    """Helper function to get payment for a completed order"""
    return db.query(Payment).filter(
        Payment.order_completed_id == completed_order.order_completed_id
    ).first()

def create_payment_history(completed_order: OrderCompleted, payment: Payment) -> PaymentHistory:
    """Helper function to create payment history object"""
    original_order_ids = [
        mapping.original_order_id 
        for mapping in completed_order.original_orders
    ]
    
    return PaymentHistory(
        payment_id=payment.payment_id,
        order_completed_id=completed_order.order_completed_id,
        original_order_ids=original_order_ids,
        amount=payment.amount_paid,
        payment_date=payment.payment_date,
        customer_name=completed_order.customer_name,
        customer_phone=completed_order.customer_phone
    )

@router.get("/customer/{phone_number}", response_model=List[PaymentHistory])
def get_customer_payments(phone_number: str, db: Session = Depends(get_db)):
    """Get all payments for a given customer phone number"""
    try:
        completed_orders = get_completed_orders_by_phone(phone_number, db)

        if not completed_orders:
            raise HTTPException(
                status_code=404, 
                detail=f"No payments found for phone number {phone_number}"
            )

        payments = []
        for completed_order in completed_orders:
            payment = get_payment_for_completed_order(completed_order, db)
            if payment:
                payment_history = create_payment_history(completed_order, payment)
                payments.append(payment_history)

        return payments

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history", response_model=List[PaymentHistory])
def get_paid_orders_history(db: Session = Depends(get_db)):
    """Get all paid orders history"""
    try:
        # Get all completed orders with their payments
        completed_orders = db.query(OrderCompleted).join(
            Payment, OrderCompleted.order_completed_id == Payment.order_completed_id
        ).order_by(Payment.payment_date.desc()).all()

        if not completed_orders:
            raise HTTPException(status_code=404, detail="No paid orders found")

        payments = []
        for completed_order in completed_orders:
            payment = get_payment_for_completed_order(completed_order, db)
            if payment:
                payment_history = create_payment_history(completed_order, payment)
                payments.append(payment_history)

        return payments

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def generate_receipt(completed_order: OrderCompleted, payment: Payment) -> ReceiptResponse:
    """Helper function to generate receipt in a consistent format"""
    # Get original order IDs from mapping
    original_order_ids = [
        mapping.original_order_id 
        for mapping in completed_order.original_orders
    ]
    
    return ReceiptResponse(
        receipt_id=f"RCP-{completed_order.order_completed_id}-{payment.payment_date.strftime('%Y%m%d')}",
        order_details=TableOrderDetails(
            table_id=completed_order.table_id,
            orders=[
                OrderDetail(
                    order_id=original_order_id,  # Use the original order ID
                    items=[
                        OrderItemDetail(
                            food_id=item.food_id,
                            quantity=item.quantity,
                            note=item.note
                        )
                        for item in completed_order.items
                    ],
                    subtotal=completed_order.total_price / len(original_order_ids)  # Split total evenly among original orders
                )
                for original_order_id in original_order_ids
            ]
        ),
        customer_info=CustomerInfo(
            name=completed_order.customer_name,
            phone=completed_order.customer_phone
        ),
        employee_info=EmployeeInfo(
            employee_id=completed_order.employee_id
        ),
        total_amount=payment.amount_paid,
        payment_date=payment.payment_date
    )

@router.get("/receipt/phone/{phone_number}", response_model=List[ReceiptResponse])
def get_receipts_by_phone(phone_number: str, db: Session = Depends(get_db)):
    """Get all receipts for a given customer phone number"""
    try:
        completed_orders = get_completed_orders_by_phone(phone_number, db)

        if not completed_orders:
            raise HTTPException(
                status_code=404, 
                detail=f"No receipts found for phone number {phone_number}"
            )

        receipts = []
        for completed_order in completed_orders:
            payment = get_payment_for_completed_order(completed_order, db)
            if payment:
                receipt = generate_receipt(completed_order, payment)
                receipts.append(receipt)

        return receipts

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/receipt/{payment_id}", response_model=ReceiptResponse)
def get_receipt(payment_id: int, db: Session = Depends(get_db)):
    """Get a specific receipt by payment ID"""
    try:
        # Get the payment record
        payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")

        # Get the completed order
        completed_order = db.query(OrderCompleted).filter(
            OrderCompleted.order_completed_id == payment.order_completed_id
        ).first()
        
        if not completed_order:
            raise HTTPException(status_code=404, detail="Completed order not found")

        receipt = generate_receipt(completed_order, payment)
        return receipt

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/tables")
def get_all_tables(db: Session = Depends(get_db)):
    """Get all tables regardless of their status"""
    try:
        tables = db.query(Table).all()
        if not tables:
            raise HTTPException(status_code=404, detail="No tables found")
            
        return [{"table_id": table.table_id, "table_status": table.table_status} for table in tables]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
