from fastapi import APIRouter

router = APIRouter()

customers_db = {}

@router.post("/")
def create_customer(customer: dict):
    customer_id = len(customers_db) + 1
    customers_db[customer_id] = customer
    return {"message": "Customer created", "customer_id": customer_id, "customer": customer}

@router.get("/{customer_id}")
def get_customer(customer_id: int):
    customer = customers_db.get(customer_id)
    if customer:
        return {"customer_id": customer_id, "customer": customer}
    return {"message": "Customer not found"}

@router.put("/{customer_id}")
def update_customer_points(customer_id: int, points: int):
    if customer_id in customers_db:
        customers_db[customer_id]["points"] = points
        return {"message": "Customer points updated", "customer_id": customer_id, "points": points}
    return {"message": "Customer not found"}
