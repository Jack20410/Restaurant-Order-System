from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from services.menu_service_client import MenuServiceClient

router = APIRouter()
menu_service = MenuServiceClient()

@router.get("/", response_model=List[Dict[str, Any]])
def get_menu():
    """
    Get the menu from the local cache, which is synchronized with the kitchen service
    """
    try:
        menu = menu_service.get_menu()
        return menu
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{food_id}", response_model=Dict[str, Any])
def get_food_item(food_id: str):
    """
    Get a specific food item from the local cache
    """
    try:
        food_item = menu_service.get_food_item(food_id)
        if not food_item:
            raise HTTPException(status_code=404, detail="Food item not found")
        return food_item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-availability", response_model=Dict[str, bool])
def check_food_availability(food_ids: List[str]):
    """
    Check the availability of multiple food items
    """
    try:
        availability = menu_service.check_food_availability(food_ids)
        return availability
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 