import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_connection_status, ensure_db_connection
from routers import menu, kitchen

# Initialize FastAPI app
app = FastAPI(
    title="Kitchen Service API",
    description="API cho Kitchen Service - Restaurant Order System",
    version="1.0.0"
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong môi trường production, nên giới hạn domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database connection
@app.on_event("startup")
async def startup_event():
    try:
        ensure_db_connection()
        print("✅ Database connection initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize database: {str(e)}")
        raise

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        ensure_db_connection()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database connection is not available: {str(e)}")

# Đăng ký routers
app.include_router(menu.router, prefix="/menu", tags=["Menu"])
app.include_router(kitchen.router, prefix="/kitchen_orders", tags=["Kitchen Orders"])

@app.get("/")
async def root():
    return {"message": "Welcome to Kitchen Service API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
