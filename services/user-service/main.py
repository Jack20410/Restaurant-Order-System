from fastapi import FastAPI
from routers import users
import database

app = FastAPI()

# Kết nối database
database.init_db()

# Thêm API routers
app.include_router(users.router, prefix="/users", tags=["Users"])

@app.get("/")
def home():
    return {"message": "User & Authentication Service Running!"}
