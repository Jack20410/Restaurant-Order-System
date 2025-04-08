from fastapi import APIRouter, Depends, HTTPException, Header
import httpx
from typing import Optional, Dict, Any, List
import os
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    mail: str
    password: str

class UserResponse(BaseModel):
    user_id: int
    name: str
    mail: str
    role: str
    shifts: str

async def forward_request(path: str, method: str = "GET", data: dict = None, 
                         headers: dict = None, params: dict = None):
    """Forward request to user service"""
    user_service_url = os.getenv("USER_SERVICE_URL", "http://user-service:8001")
    url = f"{user_service_url}{path}"
    async with httpx.AsyncClient() as client:
        try:
            if method == "GET":
                response = await client.get(url, headers=headers, params=params)
            elif method == "POST":
                response = await client.post(url, json=data, headers=headers)
            elif method == "PUT":
                response = await client.put(url, json=data, headers=headers)
            elif method == "DELETE":
                response = await client.delete(url, headers=headers)
            else:
                raise HTTPException(status_code=405, detail="Method not allowed")
                
            return response.json(), response.status_code
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"User service unavailable: {str(e)}")

@router.post("/login")
async def login(login_data: LoginRequest):
    """Login route forwarded to user service"""
    response, status_code = await forward_request(
        path="/auth/login", 
        method="POST",
        data=login_data.dict()
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.post("/register")
async def register(user_data: Dict[str, Any]):
    """Register new user route forwarded to user service"""
    response, status_code = await forward_request(
        path="/auth/register", 
        method="POST",
        data=user_data
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(authorization: str = Header(...)):
    """Get all users route forwarded to user service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path="/auth/users", 
        method="GET",
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.get("/customers")
async def get_customers(authorization: str = Header(...)):
    """Get all customers route forwarded to user service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path="/customers", 
        method="GET",
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.get("/customers/{customer_id}")
async def get_customer(customer_id: int, authorization: str = Header(...)):
    """Get customer by ID route forwarded to user service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/customers/{customer_id}", 
        method="GET",
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

# Add more route forwarding as needed