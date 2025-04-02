from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from ..models import Customer

def create_customer(db: Session, customer_data: dict):
    """
    Create a new customer in the database
    """
    try:
        customer = Customer(
            name=customer_data["name"],
            phone=customer_data["phone"],
            customer_type=customer_data.get("customer_type", "regular"),
            points=customer_data.get("points", 0.0)
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Error creating customer: {str(e)}")

def get_customer(db: Session, customer_id: int):
    """
    Get customer details by ID
    """
    return db.query(Customer).filter(Customer.customer_id == customer_id).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    """
    Get a list of customers with pagination
    """
    return db.query(Customer).offset(skip).limit(limit).all()

def update_customer(db: Session, customer_id: int, update_data: dict):
    """
    Update customer information
    """
    try:
        customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
        if not customer:
            return False
        
        # Update only the provided fields
        for key, value in update_data.items():
            if hasattr(customer, key):
                setattr(customer, key, value)
        
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Error updating customer: {str(e)}")

def delete_customer(db: Session, customer_id: int):
    """
    Delete a customer
    """
    try:
        customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
        if not customer:
            return False
        
        db.delete(customer)
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        raise Exception(f"Error deleting customer: {str(e)}") 