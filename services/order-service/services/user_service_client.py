import requests
from fastapi import HTTPException
import os

# Get the user service URL from environment or use default
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:8000")

def get_customer(customer_id: int):
    """
    Get customer details from the user-service
    """
    # Mock implementation that doesn't make HTTP requests
    return {"id": customer_id, "name": f"Customer {customer_id}", "email": f"customer{customer_id}@example.com", "points": 100}

def update_customer_points(customer_id: int, points: int):
    """
    Update customer points in the user-service
    """
    # Mock implementation that doesn't make HTTP requests
    return {"id": customer_id, "points": points} 