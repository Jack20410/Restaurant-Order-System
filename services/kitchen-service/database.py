from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import time
import os

# MongoDB Atlas connection string
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://duclinhhopham:duclinh2503@projectsoa.4nvx0yg.mongodb.net/?retryWrites=true&w=majority&appName=ProjectSOA")
DB_NAME = os.getenv("DB_NAME", "KitchenServices")

# Retry configuration
MAX_RETRIES = 5
RETRY_DELAY = 5  # seconds

# Global variables
client = None
db = None

def init_db():
    """Initialize database connection with retry logic"""
    global client, db
    
    retries = 0
    while retries < MAX_RETRIES:
        try:
            print(f"Attempting to connect to MongoDB Atlas (attempt {retries + 1}/{MAX_RETRIES})...")
            print(f"Using connection string: {MONGODB_URL}")
            print(f"Database name: {DB_NAME}")
            
            # Create a MongoDB client
            client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
            
            # Test the connection by sending a ping
            client.admin.command('ping')
            print("✅ Successfully pinged MongoDB Atlas")
            
            # Connect to the specific database
            db = client[DB_NAME]
            print(f"✅ Successfully connected to database: {DB_NAME}")
            
            # Verify the database connection by accessing a collection
            collections = db.list_collection_names()
            print(f"✅ Available collections: {collections}")
            
            return True
        
        except Exception as e:
            retries += 1
            remaining = MAX_RETRIES - retries
            
            if remaining > 0:
                print(f"❌ MongoDB connection attempt {retries} failed: {str(e)}")
                print(f"Retrying in {RETRY_DELAY} seconds... ({remaining} attempts remaining)")
                time.sleep(RETRY_DELAY)
            else:
                print(f"❌ Failed to connect to MongoDB after {MAX_RETRIES} attempts")
                print(f"Error: {str(e)}")
                raise Exception(f"Failed to connect to MongoDB: {str(e)}")

def get_connection_status():
    """Check if the MongoDB connection is active"""
    if client is None or db is None:
        return False
    
    try:
        # Test the connection by sending a ping
        client.admin.command('ping')
        return True
    except Exception as e:
        print(f"Connection check failed: {str(e)}")
        return False

def ensure_db_connection():
    """Ensure database connection is active, reconnect if necessary"""
    if not get_connection_status():
        print("⚠️ Database connection lost, attempting to reconnect...")
        init_db()
    
    if db is None:
        raise Exception("Database connection is not initialized")

# Initialize the database connection when the module is imported
try:
    init_db()
except Exception as e:
    print(f"❌ Failed to initialize database during module import: {str(e)}")
    raise
