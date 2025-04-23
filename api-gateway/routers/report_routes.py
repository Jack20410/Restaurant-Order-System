from fastapi import APIRouter, HTTPException, Header
from typing import Dict, Any, Literal
import os
from .order_routes import forward_request

router = APIRouter()

@router.get("/revenue/{time_range}")
async def get_revenue(time_range: Literal["week", "month", "year"], authorization: str = Header(...)):
    """Get revenue data for the specified time range"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header is required")

        headers = {"Authorization": authorization}
        path = f"/reports/revenue/{time_range}"
        
        print(f"Forwarding request to path: {path}")  # Debug log
        print(f"Headers: {headers}")  # Debug log
        
        response, status_code = await forward_request(
            path=path,
            method="GET",
            headers=headers
        )
        
        print(f"Response status: {status_code}")  # Debug log
        print(f"Response data: {response}")  # Debug log
        
        if status_code >= 400:
            raise HTTPException(status_code=status_code, detail=response)
            
        return response
    except HTTPException as e:
        print(f"HTTPException: {e.detail}")  # Debug log
        raise e
    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/total-sales")
async def get_total_sales(authorization: str = Header(...)):
    """Get total sales from all completed orders"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header is required")

        headers = {"Authorization": authorization}
        path = "/reports/statistics/total-sales"
        
        response, status_code = await forward_request(
            path=path,
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

@router.get("/statistics/total-customers")
async def get_total_customers(authorization: str = Header(...)):
    """Get total number of unique customers based on phone numbers"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header is required")

        headers = {"Authorization": authorization}
        path = "/reports/statistics/total-customers"
        
        response, status_code = await forward_request(
            path=path,
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

@router.get("/statistics/total-orders")
async def get_total_orders(authorization: str = Header(...)):
    """Get total number of completed orders"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header is required")

        headers = {"Authorization": authorization}
        path = "/reports/statistics/total-orders"
        
        response, status_code = await forward_request(
            path=path,
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

@router.get("/statistics/dashboard-summary")
async def get_dashboard_summary(authorization: str = Header(...)):
    """Get complete dashboard summary including statistics and top foods"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header is required")

        headers = {"Authorization": authorization}
        path = "/reports/statistics/dashboard-summary"
        
        response, status_code = await forward_request(
            path=path,
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

@router.get("/statistics/employee-summary")
async def get_employee_summary(authorization: str = Header(...)):
    """Get summary of receipts/orders created by each employee"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header is required")

        headers = {"Authorization": authorization}
        path = "/reports/statistics/employee-summary"
        
        response, status_code = await forward_request(
            path=path,
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

@router.get("/payments/history")
async def get_payment_history(authorization: str = Header(...)):
    """Get all payment history"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header is required")

        headers = {"Authorization": authorization}
        path = "/payments/history"
        
        response, status_code = await forward_request(
            path=path,
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

@router.get("/payments/customer/{phone_number}")
async def get_customer_payment_history(phone_number: str, authorization: str = Header(...)):
    """Get payment history for a specific customer"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header is required")

        headers = {"Authorization": authorization}
        path = f"/payments/customer/{phone_number}"
        
        response, status_code = await forward_request(
            path=path,
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

@router.get("/payments/receipt/{payment_id}")
async def get_payment_receipt(payment_id: int, authorization: str = Header(...)):
    """Get receipt for a specific payment"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header is required")

        headers = {"Authorization": authorization}
        path = f"/payments/receipt/{payment_id}"
        
        response, status_code = await forward_request(
            path=path,
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

@router.get("/payments/receipts/{phone_number}")
async def get_customer_receipts(phone_number: str, authorization: str = Header(...)):
    """Get all receipts for a specific customer"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header is required")

        headers = {"Authorization": authorization}
        path = f"/receipt/phone/{phone_number}"
        
        response, status_code = await forward_request(
            path=path,
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