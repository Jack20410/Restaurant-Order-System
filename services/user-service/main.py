from fastapi import FastAPI
from routers import users, auth
import database
import uvicorn

app = FastAPI()

# Kết nối database
database.init_db()

# Thêm API routers
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

@app.get("/")
def home():
    return {"message": "User & Authentication Service Running!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
