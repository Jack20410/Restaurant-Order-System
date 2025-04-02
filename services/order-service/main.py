from fastapi import FastAPI
from routers import customers, orders, payments
from database_orders import init_db

app = FastAPI()

# Tự động tạo bảng khi chạy app
init_db()

# app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])

@app.get("/")
def root():
    return {"message": "Order & Payment Service Running!"}
