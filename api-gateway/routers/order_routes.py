from fastapi import APIRouter, Depends, HTTPException, Header
import httpx
from typing import Dict, Any, List, Optional
import os
import json  # Add this import
from datetime import datetime  # Add this import

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
            raise HTTPException(status_code=500, detail=str(e))

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
    try:
        # Forward to order service
        response, status_code = await forward_request(
            path="/orders/",
            method="POST",
            data=order_data,
            headers=headers
        )
        
        if status_code >= 400:
            raise HTTPException(status_code=status_code, detail=response)
        
        # Forward to kitchen service
        kitchen_order_data = {
            "order_id": str(response["order_id"]),
            "table_id": order_data["table_id"],
            "items": order_data["items"],
            "status": "pending",
            "priority": "normal",
            "created_at": datetime.now().isoformat()
        }
        
        # Forward to kitchen service
        await forward_request(
            path="/kitchen_orders/",
            method="POST",
            data=kitchen_order_data,
            headers=headers
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active")
async def get_active_orders(authorization: str = Header(...)):
    """Get active orders"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path="/orders/active",
        method="GET",
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

@router.get("/table/{table_id}")
async def get_table_orders(table_id: int, authorization: str = Header(...)):
    """Get all orders for a specific table"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/orders/table/{table_id}",
        method="GET",
        headers=headers
    )
    return response

# <------------------------Payment endpoints------------------------>
@router.post("/payments")
async def process_payment(payment_data: Dict[str, Any], authorization: str = Header(...)):
    """Process payment for a customer and return receipt"""
    headers = {"Authorization": authorization}
    try:
        # Validate required fields
        if "table_id" not in payment_data:
            raise HTTPException(status_code=400, detail="Table ID is required")
        if "phone_number" not in payment_data:
            raise HTTPException(status_code=400, detail="Customer phone number is required")

        # Process payment
        payment_response, status_code = await forward_request(
            path="/payments/",
            method="POST",
            data=payment_data,
            headers=headers
        )
        
        if status_code >= 400:
            raise HTTPException(status_code=status_code, detail=payment_response)

        # Get receipt for the payment
        receipt_response, status_code = await forward_request(
            path=f"/payments/receipt/{payment_response['payment_id']}",
            method="GET",
            headers=headers
        )

        if status_code >= 400:
            raise HTTPException(status_code=status_code, detail=receipt_response)

        return {
            "payment": payment_response,
            "receipt": receipt_response
        }
            
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payments/customer/{phone_number}")
async def get_customer_payments(phone_number: str, authorization: str = Header(...)):
    """Get payment history and receipts for a specific customer"""
    headers = {"Authorization": authorization}
    try:
        # Get payment history
        payments_response, status_code = await forward_request(
            path=f"/payments/customer/{phone_number}",
            method="GET",
            headers=headers
        )
        
        if status_code >= 400:
            raise HTTPException(status_code=status_code, detail=payments_response)

        # Get receipts
        receipts_response, status_code = await forward_request(
            path=f"/receipt/phone/{phone_number}",
            method="GET",
            headers=headers
        )

        if status_code >= 400:
            raise HTTPException(status_code=status_code, detail=receipts_response)

        return {
            "payments": payments_response,
            "receipts": receipts_response
        }
            
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payments/history")
async def get_paid_orders_history(authorization: str = Header(...)):
    """Get all paid orders history"""
    headers = {"Authorization": authorization}
    try:
        response, status_code = await forward_request(
            path="/payments/history",
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
