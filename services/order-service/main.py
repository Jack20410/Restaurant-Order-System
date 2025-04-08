from fastapi import FastAPI
from routers import orders, payments, reports
from database_orders import init_db, get_db_connection, text
import time

app = FastAPI()

# Initialize database with retries
MAX_RETRIES = 5
RETRY_DELAY = 2  # seconds

def initialize_database():
    retries = 0
    while retries < MAX_RETRIES:
        try:
            # Test database connection
            db = get_db_connection()
            if db is not None:
                db.execute(text("SELECT 1"))
                db.close()
                # Initialize database tables
                init_db()
                print("✅ Database initialized successfully!")
                return True
            raise Exception("Database connection test failed")
        except Exception as e:
            retries += 1
            remaining = MAX_RETRIES - retries
            print(f"❌ Database initialization attempt {retries} failed: {str(e)}")
            if remaining > 0:
                print(f"Retrying in {RETRY_DELAY} seconds... ({remaining} attempts remaining)")
                time.sleep(RETRY_DELAY)
            else:
                print(f"❌ Failed to initialize database after {MAX_RETRIES} attempts")
                raise e

# Initialize database
initialize_database()

# Add API routers
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])

@app.get("/")
def root():
    return {"message": "Order & Payment Service Running!"}

@app.get("/health")
def health_check():
    """Health check endpoint that also verifies database connection"""
    db = get_db_connection()
    db_connected = False
    if db is not None:
        try:
            db.execute(text("SELECT 1"))
            db_connected = True
        except:
            pass
        finally:
            db.close()
    
    status = {
        "service": "healthy",
        "database": "connected" if db_connected else "disconnected"
    }
    if not db_connected:
        status["warning"] = "Database connection is not available"
    return status
