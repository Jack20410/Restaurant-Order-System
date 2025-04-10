from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import orders, payments, reports, tables
from database_orders import init_db, get_db_connection, text
import time

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
