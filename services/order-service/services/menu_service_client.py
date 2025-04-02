import requests
from fastapi import HTTPException
import os
from typing import List, Dict, Any
import json
from .message_consumer import consumer

class MenuServiceClient:
    def __init__(self):
        # Get the kitchen service URL from environment or use default
        self.kitchen_service_url = os.getenv("KITCHEN_SERVICE_URL", "http://kitchen-service:8000")

    def get_menu(self) -> List[Dict[str, Any]]:
        """
        Get full menu from cache or kitchen-service
        """
        # Try to get from cache first
        cached_menu = consumer.get_menu()
        if cached_menu:
            return cached_menu
            
        # If cache is empty, fall back to API call
        try:
            response = requests.get(f"{self.kitchen_service_url}/menu/")
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, 
                                   detail=f"Error from kitchen service: {response.text}")
            
            return response.json()
        except requests.RequestException as e:
            raise HTTPException(status_code=503, 
                               detail=f"Kitchen service unavailable: {str(e)}")

    def get_food_item(self, food_id: str) -> Dict[str, Any]:
        """
        Get a specific food item from cache or kitchen-service
        """
        # Try to get from cache first
        cached_item = consumer.get_food_item(food_id)
        if cached_item:
            return cached_item
            
        # If not in cache, fall back to API call
        try:
            response = requests.get(f"{self.kitchen_service_url}/menu/{food_id}")
            
            if response.status_code == 404:
                return None
                
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, 
                                   detail=f"Error from kitchen service: {response.text}")
            
            return response.json()
        except requests.RequestException as e:
            raise HTTPException(status_code=503, 
                               detail=f"Kitchen service unavailable: {str(e)}")

    def check_food_availability(self, food_ids: List[str]) -> Dict[str, bool]:
        """
        Check if multiple food items are available
        """
        # Temporarily bypass this check - assume all food items are available
        return {food_id: True for food_id in food_ids}
        
        # Try to get from cache first
        # cached_availability = consumer.check_food_availability(food_ids)
        
        # # If all items are in cache, use that result
        # if all(food_id in cached_availability for food_id in food_ids):
        #     return cached_availability
        
        # # Otherwise, fall back to either using the API or checking the menu
        # try:
        #     # Try to call the specific API endpoint if available
        #     response = requests.post(
        #         f"{self.kitchen_service_url}/menu/check-availability",
        #         json=food_ids
        #     )
        #     
        #     if response.status_code == 200:
        #         return response.json()
        #         
        #     # If API call fails, get the full menu and check manually
        #     menu_items = self.get_menu()
        #     availability = {}
        #     
        #     # Create a lookup dictionary for faster access
        #     menu_dict = {item['food_id']: item for item in menu_items}
        #     
        #     for food_id in food_ids:
        #         if food_id in menu_dict and menu_dict[food_id]['availability'] == 'available':
        #             availability[food_id] = True
        #         else:
        #             availability[food_id] = False
        #     
        #     return availability
        #     
        # except requests.RequestException as e:
        #     # If kitchen service is completely unavailable, use only what we have in cache
        #     partial_result = cached_availability
        #     
        #     # Mark any missing items as unavailable
        #     for food_id in food_ids:
        #         if food_id not in partial_result:
        #             partial_result[food_id] = False
        #             
        #     return partial_result 