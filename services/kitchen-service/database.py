from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Tải biến môi trường từ file .env
load_dotenv()

# Sử dụng biến môi trường hoặc fallback vào giá trị mặc định
DATABASE_URL = os.getenv("DATABASE_URL", "mongodb+srv://duclinhhopham:duclinh2503@projectsoa.4nvx0yg.mongodb.net/KitchenServices")
client = MongoClient(DATABASE_URL)
db = client["KitchenServices"]


def init_db():
    print("Connected to MongoDB")
