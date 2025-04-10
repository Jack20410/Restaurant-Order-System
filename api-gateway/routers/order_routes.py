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
    print(f"Forwarding request to: {url}")  # Debug log
    
    if headers:
        print(f"Headers: {headers}")  # Debug log
        
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
            
            print(f"Response status: {response.status_code}")  # Debug log
            print(f"Response body: {response.text}")  # Debug log
            
            if response.status_code >= 400:
                error_detail = response.json() if response.text else {"detail": "Unknown error"}
                raise HTTPException(status_code=response.status_code, detail=error_detail)
                
            return response.json(), response.status_code
            
        except httpx.RequestError as e:
            print(f"Request error: {str(e)}")  # Debug log
            raise HTTPException(status_code=503, detail=f"Order service unavailable: {str(e)}")
        except Exception as e:
            print(f"Unexpected error: {str(e)}")  # Debug log
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# <------------------------Table endpoints------------------------>
@router.get("/tables")
async def get_tables(authorization: str = Header(...)):
    """Get all tables"""
    try:
        headers = {"Authorization": authorization}
        response, status_code = await forward_request(
            path="/tables/",
            method="GET",
            headers=headers
        )
        
        if status_code >= 400:
            raise HTTPException(status_code=status_code, detail=response)
            
        return response
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/tables/{table_id}")
async def update_table_status(table_id: int, table_data: Dict[str, Any], authorization: str = Header(...)):
    """Update table status"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/tables/{table_id}",
        method="PUT",
        data=table_data,
        headers=headers
    )
    return response

@router.post("/tables/init")
async def initialize_tables(authorization: str = Header(...)):
    """Initialize tables"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path="/tables/init",
        method="POST",
        headers=headers
    )
    return response

# <------------------------Order endpoints------------------------> 
@router.post("/")
async def create_order(order_data: Dict[str, Any], authorization: str = Header(...)):
    """Create new order"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path="/orders",
        method="POST",
        data=order_data,
        headers=headers
    )
    return response

@router.get("/{order_id}")
async def get_order(order_id: int, authorization: str = Header(...)):
    """Get order by ID"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/orders/{order_id}",
        method="GET",
        headers=headers
    )
    return response

@router.put("/{order_id}")
async def update_order(order_id: int, order_data: Dict[str, Any], authorization: str = Header(...)):
    """Update order"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/orders/{order_id}",
        method="PUT",
        data=order_data,
        headers=headers
    )
    return response

@router.put("/{order_id}/status")
async def update_order_status(order_id: int, status_data: Dict[str, str], authorization: str = Header(...)):
    """Update order status"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/orders/{order_id}/status",
        method="PUT",
        data=status_data,
        headers=headers
    )
    return response

@router.post("/{order_id}/items")
async def add_order_item(order_id: int, item_data: Dict[str, Any], authorization: str = Header(...)):
    """Add item to order"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/orders/{order_id}/items",
        method="POST",
        data=item_data,
        headers=headers
    )
    return response

@router.put("/{order_id}/items/{item_id}")
async def update_order_item(
    order_id: int, 
    item_id: int, 
    item_data: Dict[str, Any], 
    authorization: str = Header(...)
):
    """Update order item"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/orders/{order_id}/items/{item_id}",
        method="PUT",
        data=item_data,
        headers=headers
    )
    return response

@router.delete("/{order_id}/items/{item_id}")
async def delete_order_item(order_id: int, item_id: int, authorization: str = Header(...)):
    """Delete order item"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/orders/{order_id}/items/{item_id}",
        method="DELETE",
        headers=headers
    )
    return response

@router.get("/tables/available")
async def get_available_tables(authorization: str = Header(...)):
    """Get available tables"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path="/tables/available",
        method="GET",
        headers=headers
    )
    return response

@router.put("/tables/{table_id}/reserve")
async def reserve_table(table_id: int, authorization: str = Header(...)):
    """Reserve a table"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/tables/{table_id}/reserve",
        method="PUT",
        headers=headers
    )
    return response

@router.post("/payments")
async def process_payment(payment_data: Dict[str, Any], authorization: str = Header(...)):
    """Process payment"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path="/orders/payments",
        method="POST",
        data=payment_data,
        headers=headers
    )
    return response
