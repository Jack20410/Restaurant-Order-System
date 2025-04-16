from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services import order_service
from datetime import datetime
from schemas import OrderCreate, OrderItem, OrderItemCreate

router = APIRouter()

@router.get("/active")
def get_active_orders():
    try:
        orders = order_service.get_active_orders()
        return orders
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/")
def create_order(order: OrderCreate):
    try:
        # 1. Log received order
        print("Received order data:", order.dict())
        
        # 2. Validate order data
        if not order.items:
            raise HTTPException(
                status_code=422,
                detail="Order must contain at least one item"
            )
            
        # 3. Check for duplicate items
        food_ids = [item.food_id for item in order.items]
        duplicates = set([x for x in food_ids if food_ids.count(x) > 1])
        if duplicates:
            raise HTTPException(
                status_code=422,
                detail=f"Duplicate food items found: {', '.join(duplicates)}"
            )
            
        # 4. Validate individual items
        for idx, item in enumerate(order.items):
            if not item.food_id:
                raise HTTPException(
                    status_code=422,
                    detail=f"Item at position {idx} has no food_id"
                )
            if item.quantity <= 0:
                raise HTTPException(
                    status_code=422,
                    detail=f"Item {item.food_id} must have quantity greater than 0"
                )
                
        # 5. Create order in database
        try:
            order_id = order_service.create_order(order.dict())
        except Exception as e:
            print(f"Database error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create order: {str(e)}"
            )
            
        # 6. Prepare response
        response_data = {
            "message": "Order created successfully",
            "order_id": order_id,
            "order_details": {
                "employee_id": order.employee_id,
                "table_id": order.table_id,
                "status": order.order_status,
                "total_price": order.total_price,
                "items": [
                    {
                        "food_id": item.food_id,
                        "quantity": item.quantity,
                        "note": item.note or ""
                    } for item in order.items
                ]
            }
        }
        
        print("Order created successfully:", response_data)
        return response_data
        
    except HTTPException as e:
        # Re-raise HTTP exceptions
        print(f"Validation error: {e.detail}")
        raise e
    except Exception as e:
        # Handle unexpected errors
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/{order_id}")
def get_order(order_id: int):
    order = order_service.get_order_details(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

class OrderStatusUpdate(BaseModel):
    status: str

@router.put("/{order_id}/status")
def update_order_status(order_id: int, status_update: OrderStatusUpdate):
    success = order_service.update_order_status(order_id, status_update.status)
    if not success:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated successfully"}

class OrderUpdate(BaseModel):
    employee_id: Optional[int] = None
    table_id: Optional[int] = None
    total_price: Optional[float] = None

@router.put("/{order_id}")
def update_order(order_id: int, order_update: OrderUpdate):
    try:
        success = order_service.update_order(order_id, order_update.dict(exclude_unset=True))
        if not success:
            raise HTTPException(status_code=404, detail="Order not found")
        return {"message": "Order updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{order_id}/items")
def add_order_item(order_id: int, item: OrderItem):
    try:
        success = order_service.add_order_item(order_id, item.dict())
        if not success:
            raise HTTPException(status_code=404, detail="Order not found")
        return {"message": "Item added successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{order_id}/items/{item_id}")
def update_order_item(order_id: int, item_id: int, item: OrderItem):
    try:
        success = order_service.update_order_item(order_id, item_id, item.dict())
        if not success:
            raise HTTPException(status_code=404, detail="Order item not found")
        return {"message": "Item updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{order_id}/items/{item_id}")
def delete_order_item(order_id: int, item_id: int):
    try:
        success = order_service.delete_order_item(order_id, item_id)
        if not success:
            raise HTTPException(status_code=404, detail="Order item not found")
        return {"message": "Item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class PaymentCreate(BaseModel):
    order_id: int
    amount: float
    payment_method: str
    transaction_id: Optional[str] = None

@router.post("/payments")
def process_payment(payment: PaymentCreate):
    try:
        success = order_service.process_payment(payment.dict())
        if not success:
            raise HTTPException(status_code=400, detail="Payment processing failed")
        return {"message": "Payment processed successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/tables")
def get_all_tables():
    try:
        tables = order_service.get_all_tables()
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class TableStatusUpdate(BaseModel):
    table_status: str

@router.put("/tables/{table_id}")
def update_table_status(table_id: int, status_update: TableStatusUpdate):
    try:
        success = order_service.update_table_status(table_id, status_update.table_status)
        if not success:
            raise HTTPException(status_code=404, detail="Table not found")
        return {"message": "Table status updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
