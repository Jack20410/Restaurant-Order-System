from fastapi import FastAPI
from routers import orders, payments, customers

app = FastAPI()

app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(customers.router, prefix="/customers", tags=["Customers"])

@app.get("/")
def root():
    return {"message": "Order & Payment Service Running!"}