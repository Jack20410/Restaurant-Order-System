# routers/payments.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/")
def process_payment(payment: dict):
    return {"message": "Payment processed", "payment": payment}
