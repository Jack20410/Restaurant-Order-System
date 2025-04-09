from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import customers, orders, payments
from database_orders import init_db

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tự động tạo bảng khi chạy app
init_db()

app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])

@app.get("/")
def root():
    return {"message": "Order & Payment Service Running!"}
