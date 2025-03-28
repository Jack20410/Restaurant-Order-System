import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import menu, kitchen

# Khởi tạo ứng dụng FastAPI
app = FastAPI(
    title="Kitchen Service API",
    description="API cho Kitchen Service - Restaurant Order System",
    version="1.0.0"
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong môi trường production, nên giới hạn domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kết nối database
init_db()

# Đăng ký routers
app.include_router(menu.router, prefix="/menu", tags=["Menu"])
app.include_router(kitchen.router, prefix="/kitchen_orders", tags=["Kitchen Orders"])

@app.get("/")
def home():
    return {"message": "Kitchen & Menu Service Running!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
