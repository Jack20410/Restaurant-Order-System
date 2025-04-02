from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import SessionLocal
from services import customer_service
from pydantic import BaseModel

router = APIRouter()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for request/response
class CustomerBase(BaseModel):
    name: str
    phone: str
    customer_type: Optional[str] = "regular"
    points: Optional[float] = 0.0

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    customer_type: Optional[str] = None
    points: Optional[float] = None

class CustomerResponse(CustomerBase):
    customer_id: int
    
    class Config:
        orm_mode = True

# Endpoints
@router.post("/", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    return customer_service.create_customer(db, customer.dict())

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = customer_service.get_customer(db, customer_id)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@router.get("/", response_model=List[CustomerResponse])
def get_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    customers = customer_service.get_customers(db, skip=skip, limit=limit)
    return customers

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, customer: CustomerUpdate, db: Session = Depends(get_db)):
    db_customer = customer_service.get_customer(db, customer_id)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Filter out None values
    update_data = {k: v for k, v in customer.dict().items() if v is not None}
    success = customer_service.update_customer(db, customer_id, update_data)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update customer")
    
    return customer_service.get_customer(db, customer_id)

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = customer_service.get_customer(db, customer_id)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    success = customer_service.delete_customer(db, customer_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete customer")
    
    return {"message": "Customer deleted successfully"} 