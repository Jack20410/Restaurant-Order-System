from fastapi import APIRouter, HTTPException
from database import db

router = APIRouter()
food_menu = db["food_menu"]

@router.get("/")
def get_menu():
    return list(food_menu.find({}, {"_id": 0}))

@router.post("/")
def add_food(item: dict):
    if food_menu.find_one({"name": item["name"]}):
        raise HTTPException(status_code=400, detail="Food already exists")
    food_menu.insert_one(item)
    return {"message": "Food added"}

@router.put("/{food_id}")
def update_food_status(food_id: str, status: str):
    result = food_menu.update_one({"food_id": food_id}, {"$set": {"availability": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Food not found")
    return {"message": "Food status updated"}
