from fastapi import APIRouter, Depends, HTTPException, Header
import httpx
from typing import Dict, Any, List, Optional
import os

router = APIRouter()

async def forward_request(path: str, method: str = "GET", data: dict = None, 
                         headers: dict = None, params: dict = None):
    """Forward request to order service"""
    order_service_url = os.getenv("ORDER_SERVICE_URL", "http://order-service:8002")
    url = f"{order_service_url}{path}"
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
            raise HTTPException(status_code=503, detail=f"Order service unavailable: {str(e)}")

@router.post("/")
async def create_order(order_data: Dict[str, Any], authorization: str = Header(...)):
    """Create new order route forwarded to order service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path="/orders", 
        method="POST",
        data=order_data,
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.get("/{order_id}")
async def get_order(order_id: int, authorization: str = Header(...)):
    """Get order by ID route forwarded to order service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/orders/{order_id}", 
        method="GET",
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.put("/{order_id}")
async def update_order(order_id: int, order_data: Dict[str, Any], authorization: str = Header(...)):
    """Update order route forwarded to order service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/orders/{order_id}", 
        method="PUT",
        data=order_data,
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.post("/{order_id}/payment")
async def process_payment(order_id: int, payment_data: Dict[str, Any], authorization: str = Header(...)):
    """Process payment route forwarded to order service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/payments", 
        method="POST",
        data={**payment_data, "order_id": order_id},
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.get("/reports/daily")
async def get_daily_report(date: Optional[str] = None, authorization: str = Header(...)):
    """Get daily report route forwarded to order service"""
    headers = {"Authorization": authorization}
    params = {"target_date": date} if date else None
    response, status_code = await forward_request(
        path="/reports/daily", 
        method="GET",
        headers=headers,
        params=params
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response
