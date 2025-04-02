import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import menu, kitchen_orders
from services.message_consumer import consumer
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
logger.info("Initializing database...")
init_db()

# Initialize message consumer (already started in the message_consumer module)
logger.info("Message consumer initialized and running in background")

# Đăng ký routers
app.include_router(menu.router, prefix="/menu", tags=["Menu"])
app.include_router(kitchen_orders.router, prefix="/kitchen_orders", tags=["Kitchen Orders"])

@app.get("/")
def home():
    return {"message": "Kitchen & Menu Service Running!"}

@app.on_event("shutdown")
def shutdown_event():
    """
    Stop the message consumer when the application shuts down
    """
    logger.info("Shutting down message consumer...")
    consumer.stop_consuming()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
