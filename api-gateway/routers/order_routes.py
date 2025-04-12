from fastapi import APIRouter, Depends, HTTPException, Header
import httpx
from typing import Dict, Any, List, Optional
import os
import json
from fastapi import Request

router = APIRouter()

async def forward_request(path: str, method: str = "GET", data: dict = None, 
                         headers: dict = None, params: dict = None):
    """Forward request to order service"""
    order_service_url = os.getenv("ORDER_SERVICE_URL", "http://order-service:8002")
    url = f"{order_service_url}{path}"
    print(f"[Order Service] Forwarding {method} request to: {url}")
    print(f"[Order Service] Request headers: {headers}")
    print(f"[Order Service] Request data: {data}")
    
    async with httpx.AsyncClient() as client:
        try:
            if method == "GET":
                response = await client.get(url, headers=headers, params=params)
            elif method == "POST":
                print(f"[Order Service] Sending POST request with data: {data}")
                response = await client.post(url, json=data, headers=headers)
            elif method == "PUT":
                response = await client.put(url, json=data, headers=headers)
            elif method == "DELETE":
                response = await client.delete(url, headers=headers)
            else:
                raise HTTPException(status_code=405, detail="Method not allowed")
            
            print(f"[Order Service] Response status: {response.status_code}")
            print(f"[Order Service] Response headers: {dict(response.headers)}")
            print(f"[Order Service] Response body: {response.text}")
            
            if response.status_code >= 400:
                try:
                    error_detail = response.json()
                    print(f"[Order Service] Parsed error response JSON: {error_detail}")
                except Exception as parse_error:
                    print(f"[Order Service] Failed to parse error response as JSON: {str(parse_error)}")
                    error_detail = {"detail": response.text or "Unknown error"}
                
                print(f"[Order Service] Final error response: {error_detail}")
                
                # Special handling for validation errors (422)
                if response.status_code == 422:
                    if isinstance(error_detail, dict) and "detail" in error_detail:
                        detail = error_detail["detail"]
                        print(f"[Order Service] Validation error details: {detail}")
                        # If it's a validation error with field information
                        if isinstance(detail, list) and len(detail) > 0:
                            # Get all field errors
                            field_errors = []
                            for err in detail:
                                field = ".".join(err.get("loc", []))
                                msg = err.get("msg", "")
                                field_errors.append(f"{field}: {msg}")
                            error_msg = "; ".join(field_errors)
                            raise HTTPException(status_code=422, detail=error_msg)
                    
                    # If we couldn't extract field errors, just pass through the original error
                    raise HTTPException(status_code=422, detail=error_detail)
                    
                # For other error types
                if isinstance(error_detail, dict) and "detail" in error_detail:
                    detail = error_detail["detail"]
                else:
                    detail = error_detail
                
                raise HTTPException(status_code=response.status_code, detail=detail)
                
            return response.json(), response.status_code
            
        except httpx.RequestError as e:
            print(f"[Order Service] Request error: {str(e)}")
            raise HTTPException(status_code=503, detail=f"Order service unavailable: {str(e)}")
        except Exception as e:
            print(f"[Order Service] Unexpected error: {str(e)}")
            if isinstance(e, HTTPException):
                raise e
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
@router.post("/orders")
async def create_order(request: Request):
    try:
        # 1. Get and validate the authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(
                status_code=401,
                detail="Invalid authorization header"
            )
        
        token = auth_header.split(' ')[1]
        
        # 2. Verify token with user service
        try:
            verify_response = await httpx.post(
                'http://user-service:8001/auth/verify',
                json={'token': token},
                timeout=10.0
            )
            
            if verify_response.status_code != 200:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid or expired token"
                )
                
        except httpx.RequestError:
            raise HTTPException(
                status_code=503,
                detail="User service unavailable"
            )
        
        # 3. Get request body
        body = await request.json()
        print(f"Received order request: {json.dumps(body, indent=2)}")
        
        # 4. Forward to order service
        try:
            async with httpx.AsyncClient() as client:
                # Remove trailing slash to match order service endpoint
                order_response = await client.post(
                    'http://order-service:8002/orders',  # Removed trailing slash
                    json=body,
                    headers={'Content-Type': 'application/json'},
                    timeout=10.0
                )
                
                print(f"Order service response status: {order_response.status_code}")
                print(f"Order service response: {order_response.text}")
                
                # If order service returns an error, forward it
                if order_response.status_code >= 400:
                    error_detail = order_response.json().get('detail', str(order_response.content))
                    raise HTTPException(
                        status_code=order_response.status_code,
                        detail=error_detail
                    )
                
                return order_response.json()
                
        except httpx.RequestError as e:
            print(f"Request error to order service: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail="Order service unavailable"
            )
            
    except HTTPException as e:
        # Log the error and re-raise
        print(f"Error processing order: {e.detail}")
        raise e
    except Exception as e:
        # Log unexpected errors
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

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
