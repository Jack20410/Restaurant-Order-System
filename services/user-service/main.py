from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User


from routers import users, auth
import database
import uvicorn
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
            if database.test_connection():
                # Initialize database tables
                database.init_db()
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
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

@app.get("/")
def home():
    return {"message": "User & Authentication Service Running!"}

@app.get("/health")
def health_check():
    """Health check endpoint that also verifies database connection"""
    db_connected = database.test_connection()
    status = {
        "service": "healthy",
        "database": "connected" if db_connected else "disconnected"
    }
    if not db_connected:
        status["warning"] = "Database connection is not available"
    return status




