from fastapi import APIRouter, Depends, HTTPException, Query, Header
from typing import Dict, Any, List, Optional
from datetime import date, datetime
from services.reporting_service import ReportingService
from schemas import ShiftReport, DailyReceipts, MonthlyReceipts, YearlyReceipts
import requests
import json

router = APIRouter()

async def verify_manager_role(authorization: str = Header(...)):
    """
    Verify that the current user has manager role
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = authorization.replace("Bearer ", "")
    # Call user-service to verify token and role
    try:
        response = requests.post(
            "http://user-service:8001/auth/verify",
            json={"token": token, "required_role": "manager"}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=403,
                detail="Manager role required to access reports"
            )
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="Authentication service unavailable")
    
    return True

@router.get("/shift", response_model=ShiftReport)
async def get_shift_receipts(
    employee_id: int,
    shift_date: str = Query(None, description="Date in YYYY-MM-DD format"),
    _: bool = Depends(verify_manager_role)
):
    """
    Get receipt summary for an employee's shift on a specific date.
    If no date is provided, current date is used.
    Requires manager role.
    """
    # Parse date or use current date
    if shift_date:
        try:
            target_date = date.fromisoformat(shift_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Date format must be YYYY-MM-DD")
    else:
        target_date = date.today()
        
    return ReportingService.get_shift_receipts(employee_id, target_date)

@router.get("/daily", response_model=DailyReceipts)
async def get_daily_receipts(
    target_date: str = Query(None, description="Date in YYYY-MM-DD format"),
    _: bool = Depends(verify_manager_role)
):
    """
    Get receipt summary for a specific day.
    If no date is provided, current date is used.
    Requires manager role.
    """
    # Parse date or use current date
    if target_date:
        try:
            parsed_date = date.fromisoformat(target_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Date format must be YYYY-MM-DD")
    else:
        parsed_date = date.today()
        
    return ReportingService.get_daily_receipts(parsed_date)

@router.get("/monthly", response_model=MonthlyReceipts)
async def get_monthly_receipts(
    year: int = Query(..., description="Year (e.g., 2023)"),
    month: int = Query(..., description="Month (1-12)"),
    _: bool = Depends(verify_manager_role)
):
    """
    Get receipt summary for a specific month.
    Requires manager role.
    """
    # Validate month
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
        
    return ReportingService.get_monthly_receipts(year, month)

@router.get("/yearly", response_model=YearlyReceipts)
async def get_yearly_receipts(
    year: int = Query(..., description="Year (e.g., 2023)"),
    _: bool = Depends(verify_manager_role)
):
    """
    Get receipt summary for a specific year.
    Requires manager role.
    """
    # Validate year (basic validation)
    current_year = datetime.now().year
    if year < 2000 or year > current_year + 1:
        raise HTTPException(status_code=400, detail=f"Year must be between 2000 and {current_year + 1}")
        
    return ReportingService.get_yearly_receipts(year) 