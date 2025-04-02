from fastapi import FastAPI
import uvicorn
from routers import orders, payments, menu
from database_orders import init_db
from services.message_consumer import consumer
import logging

app = FastAPI()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database
logger.info("Initializing database...")
init_db()

# Initialize message consumer (already started in the message_consumer module)
logger.info("Message consumer initialized and running in background")

# Include API routers
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(menu.router, prefix="/menu", tags=["Menu"])

@app.get("/")
def root():
    return {"message": "Order & Payment Service Running!"}

@app.on_event("shutdown")
def shutdown_event():
    """
    Stop the message consumer when the application shuts down
    """
    logger.info("Shutting down message consumer...")
    consumer.stop_consuming()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)