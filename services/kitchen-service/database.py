from pymongo import MongoClient

DATABASE_URL = "mongodb://localhost:27017"
client = MongoClient(DATABASE_URL)
db = client["restaurant_db"]

def init_db():
    print("Connected to MongoDB")
