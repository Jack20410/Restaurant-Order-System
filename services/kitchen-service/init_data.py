from database import init_db

def init_menu_data():
    """Initialize database connection"""
    # Initialize database connection
    init_db()
    print("✅ Database connection initialized successfully")

if __name__ == "__main__":
    init_menu_data() 