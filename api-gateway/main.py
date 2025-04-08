from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
import httpx
from fastapi.security import OAuth2PasswordBearer
from routers import user_routes, order_routes, kitchen_routes
import json

app = FastAPI(title="Restaurant API Gateway")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

async def verify_token(token: str):
    """Verify token with user service"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "http://user-service:8001/auth/verify",
                json={"token": token}
            )
            if response.status_code == 200:
                return response.json()
            return None
        except httpx.RequestError:
            return None

# Include routers from different services
app.include_router(user_routes.router, prefix="/api/users", tags=["Users"])
app.include_router(order_routes.router, prefix="/api/orders", tags=["Orders"])
app.include_router(kitchen_routes.router, prefix="/api/kitchen", tags=["Kitchen"])

@app.get("/")
async def root():
    return {"message": "Restaurant Order System API Gateway"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint for API gateway"""
    services = {
        "api_gateway": "healthy",
        "user_service": "unknown",
        "order_service": "unknown",
        "kitchen_service": "unknown"
    }
    
    async with httpx.AsyncClient() as client:
        # Check user service
        try:
            user_response = await client.get("http://user-service:8001/")
            services["user_service"] = "healthy" if user_response.status_code == 200 else "unhealthy"
        except httpx.RequestError:
            services["user_service"] = "unhealthy"
            
        # Check order service
        try:
            order_response = await client.get("http://order-service:8002/")
            services["order_service"] = "healthy" if order_response.status_code == 200 else "unhealthy"
        except httpx.RequestError:
            services["order_service"] = "unhealthy"
            
        # Check kitchen service
        try:
            kitchen_response = await client.get("http://kitchen-service:8003/")
            services["kitchen_service"] = "healthy" if kitchen_response.status_code == 200 else "unhealthy"
        except httpx.RequestError:
            services["kitchen_service"] = "unhealthy"
    
    return services