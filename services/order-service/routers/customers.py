from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database_orders import SessionLocal
from models import Customer
router = APIRouter()

# Schema cho request body
class CustomerCreate(BaseModel):
    name: str
    email: str
    points: int = 0  # Cho phép nhập points từ JSON

class CustomerUpdatePoints(BaseModel):
    points: int  # Nhận points từ JSON khi update

# Add these new schema classes
class CustomerUpdateName(BaseModel):
    name: str

class CustomerUpdateEmail(BaseModel):
    email: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_customer(customer_data: CustomerCreate, db: Session = Depends(get_db)):
    customer = Customer(
        name=customer_data.name,
        email=customer_data.email,
        points=customer_data.points  # Nhận giá trị points từ JSON
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return {"message": "Customer created", "customer": customer}

@router.get("/{id}")
def get_customer(id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "points": customer.points
    }

@router.put("/{id}")
def update_customer_points(id: int, update_data: CustomerUpdatePoints, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer.points = update_data.points  # Cập nhật points từ body JSON
    db.commit()
    return {"message": "Customer points updated", "customer_id": id, "points": update_data.points}

# Add these new endpoints
@router.put("/{id}/name")
def update_customer_name(id: int, update_data: CustomerUpdateName, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer.name = update_data.name
    db.commit()
    return {"message": "Customer name updated", "customer_id": id, "name": update_data.name}

@router.put("/{id}/email")
def update_customer_email(id: int, update_data: CustomerUpdateEmail, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    try:
        customer.email = update_data.email
        db.commit()
        return {"message": "Customer email updated", "customer_id": id, "email": update_data.email}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already exists")
