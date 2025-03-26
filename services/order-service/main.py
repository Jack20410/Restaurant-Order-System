from fastapi import FastAPI
from routers import orders, payments
import database

app = FastAPI()

# Kết nối database
database.init_db()

# Thêm API routers
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])

@app.get("/")
def home():
    return {"message": "Order & Payment Service Running!"}
