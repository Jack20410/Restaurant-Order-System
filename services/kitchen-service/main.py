from fastapi import FastAPI
from routers import menu, kitchen
import database
import uvicorn
app = FastAPI()

# Kết nối database
database.init_db()

# Thêm API routers
app.include_router(menu.router, prefix="/menu", tags=["Menu"])
app.include_router(kitchen.router, prefix="/kitchen", tags=["Kitchen"])

@app.get("/")
def home():
    return {"message": "Kitchen & Menu Service Running!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003, reload=True)
