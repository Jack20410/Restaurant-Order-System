from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routers import orders, payments, reports, tables
from database_orders import init_db, get_db_connection, text
import time
import json

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database with retries
max_retries = 5
retry_delay = 5  # seconds

# Store active WebSocket connections
active_connections = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle new order
            if data.get("type") == "new_order":
                # Create order in database
                order_data = data.get("order")
                try:
                    order_id = orders.create_order(order_data)
                    
                    # Broadcast to all connected clients
                    for connection in active_connections:
                        await connection.send_json({
                            "type": "order_update",
                            "order_id": order_id,
                            "status": "pending",
                            "data": order_data
                        })
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e)
                    })
            
            # Handle order status update
            elif data.get("type") == "status_update":
                order_id = data.get("order_id")
                new_status = data.get("status")
                try:
                    orders.update_order_status(order_id, new_status)
                    
                    # Broadcast status update
                    for connection in active_connections:
                        await connection.send_json({
                            "type": "status_update",
                            "order_id": order_id,
                            "status": new_status
                        })
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e)
                    })
    except WebSocketDisconnect:
        active_connections.remove(websocket)

for i in range(max_retries):
    try:
        # Test database connection
        db = get_db_connection()
        if db:
            # Initialize database tables
            init_db()
            db.close()
            break
    except Exception as e:
        if i < max_retries - 1:
            print(f"Failed to connect to database (attempt {i + 1}/{max_retries}). Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
        else:
            print("Failed to initialize database after maximum retries")
            raise e

# Include routers
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(tables.router, prefix="/tables", tags=["Tables"])

@app.get("/")
def read_root():
    return {"message": "Order Service is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
