from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import database
import schemas
from services import customer_service

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=int)
def create_customer(
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db)
):
    customer_id = customer_service.create_customer(db, customer.dict())
    return customer_id

@router.get("/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):
    customer = customer_service.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=bool)
def update_customer(
    customer_id: int,
    customer_data: schemas.CustomerUpdate,
    db: Session = Depends(get_db)
):
    customer_exists = customer_service.get_customer(db, customer_id)
    if not customer_exists:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    success = customer_service.update_customer(db, customer_id, customer_data.dict())
    return success 