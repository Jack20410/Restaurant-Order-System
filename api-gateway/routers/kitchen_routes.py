from fastapi import APIRouter, Depends, HTTPException, Header
import httpx
from typing import Dict, Any, List, Optional
import os
from fastapi import File, UploadFile, Form

router = APIRouter()

async def forward_request(path: str, method: str = "GET", data: dict = None, 
                         headers: dict = None, params: dict = None, files: dict = None):
    """Forward request to kitchen service"""
    kitchen_service_url = os.getenv("KITCHEN_SERVICE_URL", "http://kitchen-service:8003")
    url = f"{kitchen_service_url}{path}"
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            if files:
                # Handle multipart form data
                form_data = {}
                if data:
                    form_data.update(data)
                files_dict = {
                    'file': (files['file'].filename, files['file'].file, files['file'].content_type)
                }
                if method == "POST":
                    response = await client.post(url, data=form_data, files=files_dict, headers=headers)
                else:
                    raise HTTPException(status_code=405, detail="Method not allowed for file upload")
            else:
                # Handle regular requests
                if method == "GET":
                    response = await client.get(url, headers=headers, params=params)
                elif method == "POST":
                    response = await client.post(url, json=data, headers=headers)
                elif method == "PUT":
                    response = await client.put(url, json=data, headers=headers)
                elif method == "PATCH":
                    response = await client.patch(url, json=data, headers=headers)
                elif method == "DELETE":
                    response = await client.delete(url, headers=headers)
                else:
                    raise HTTPException(status_code=405, detail="Method not allowed")
                
            return response.json(), response.status_code
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Kitchen service unavailable: {str(e)}")

#<------------------------Menu routes------------------------>
@router.get("/menu", response_model=List[Dict[str, Any]])
async def get_menu():
    """Get full menu route forwarded to kitchen service"""
    response, status_code = await forward_request(
        path="/menu/", 
        method="GET"
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.post("/menu", response_model=Dict[str, str])
async def add_food_item(food_data: Dict[str, Any], authorization: str = Header(...)):
    """Add new food item route forwarded to kitchen service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path="/menu/",
        method="POST",
        data=food_data,
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.post("/menu/upload-image")
async def upload_food_image(
    file: UploadFile = File(...),
    category: str = Form(...),
    authorization: str = Header(...)
):
    """Upload food image route forwarded to kitchen service"""
    headers = {
        "Authorization": authorization
    }
    
    response, status_code = await forward_request(
        path="/menu/upload-image",
        method="POST",
        data={"category": category},
        files={"file": file},
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.delete("/menu/{food_id}", response_model=Dict[str, str])
async def delete_food_item(food_id: str, authorization: str = Header(...)):
    """Delete food item route forwarded to kitchen service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/menu/{food_id}",
        method="DELETE",
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.get("/menu/available", response_model=List[Dict[str, Any]])
async def get_available_menu():
    """Get available menu items route forwarded to kitchen service"""
    response, status_code = await forward_request(
        path="/menu/available", 
        method="GET"
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.get("/menu/category/{category}", response_model=List[Dict[str, Any]])
async def get_menu_by_category(category: str):
    """Get menu by category route forwarded to kitchen service"""
    response, status_code = await forward_request(
        path=f"/menu/category/{category}", 
        method="GET"
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.patch("/menu/{food_id}/availability")
async def update_food_availability(food_id: str, data: Dict[str, bool], authorization: str = Header(...)):
    """Update food availability route forwarded to kitchen service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/menu/{food_id}/availability", 
        method="PATCH",
        data=data,
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.get("/menu/{food_id}")
async def get_menu_item(food_id: str):
    """Get menu item by ID route forwarded to kitchen service"""
    response, status_code = await forward_request(
        path=f"/menu/{food_id}", 
        method="GET"
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

#<------------------------Kitchen order routes------------------------>
@router.get("/orders")
async def get_kitchen_orders(authorization: str = Header(...)):
    """Get kitchen orders route forwarded to kitchen service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path="/kitchen_orders/", 
        method="GET",
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.post("/orders")
async def create_kitchen_order(order_data: Dict[str, Any], authorization: str = Header(...)):
    """Create kitchen order route forwarded to kitchen service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path="/kitchen_orders/", 
        method="POST",
        data=order_data,
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.put("/orders/{order_id}")
async def update_kitchen_order_status(order_id: str, status_data: Dict[str, str], authorization: str = Header(...)):
    """Update kitchen order status route forwarded to kitchen service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/{order_id}", 
        method="PUT",
        data=status_data,
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.patch("/orders/{order_id}/serve")
async def mark_items_served(order_id: str, data: Dict[str, List[int]], authorization: str = Header(...)):
    """Mark items as served route forwarded to kitchen service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path=f"/kitchen_orders/{order_id}/serve", 
        method="PATCH",
        data=data,
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response

@router.get("/orders/ready-to-serve")
async def get_ready_to_serve_orders(authorization: str = Header(...)):
    """Get orders ready to serve route forwarded to kitchen service"""
    headers = {"Authorization": authorization}
    response, status_code = await forward_request(
        path="/kitchen_orders/ready-to-serve", 
        method="GET",
        headers=headers
    )
    
    if status_code >= 400:
        raise HTTPException(status_code=status_code, detail=response)
    
    return response
