from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import httpx

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates
templates = Jinja2Templates(directory="app/templates")

# Service URLs
ORDER_SERVICE_URL = "http://order-service:8000"
KITCHEN_SERVICE_URL = "http://kitchen-service:8000"
USER_SERVICE_URL = "http://user-service:8000"

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("role_selection.html", {"request": request})

@app.get("/waiter", response_class=HTMLResponse)
async def waiter_view(request: Request):
    try:
        async with httpx.AsyncClient() as client:
            # Get available tables
            tables_response = await client.get(f"{ORDER_SERVICE_URL}/orders/tables/available")
            tables = tables_response.json()["tables"] if tables_response.status_code == 200 else []
            
            # Get menu items
            menu_response = await client.get(f"{ORDER_SERVICE_URL}/menu/")
            menu_items = menu_response.json() if menu_response.status_code == 200 else []
            
            # Extract unique categories from menu items
            categories = sorted(list(set(item.get('category', '') for item in menu_items)))
            
            return templates.TemplateResponse(
                "waiter/dashboard.html",
                {
                    "request": request,
                    "tables": tables,
                    "menu_items": menu_items,
                    "categories": categories
                }
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")

@app.get("/kitchen", response_class=HTMLResponse)
async def kitchen_view(request: Request):
    try:
        async with httpx.AsyncClient() as client:
            # Get menu items
            menu_response = await client.get(f"{KITCHEN_SERVICE_URL}/menu/")
            menu_items = menu_response.json() if menu_response.status_code == 200 else []
            
            # Get kitchen orders
            orders_response = await client.get(f"{KITCHEN_SERVICE_URL}/orders/")
            orders = orders_response.json() if orders_response.status_code == 200 else []
            
            return templates.TemplateResponse(
                "kitchen/dashboard.html",
                {
                    "request": request,
                    "menu_items": menu_items,
                    "orders": orders
                }
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")

@app.get("/api/menu")
async def get_menu():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{KITCHEN_SERVICE_URL}/menu/")
        return response.json()

@app.get("/api/orders")
async def get_orders():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{ORDER_SERVICE_URL}/orders/")
        return response.json()

@app.get("/api/tables")
async def get_tables():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{ORDER_SERVICE_URL}/orders/tables/available")
        return response.json()

@app.put("/api/orders/tables/{table_id}/reserve")
async def reserve_table(table_id: int, status: dict):
    async with httpx.AsyncClient() as client:
        response = await client.put(
            f"{ORDER_SERVICE_URL}/orders/tables/{table_id}/reserve",
            json=status
        )
        return response.json()

@app.post("/api/orders/")
async def create_order(order: dict):
    try:
        async with httpx.AsyncClient() as client:
            # Submit order to order service
            order_response = await client.post(
                f"{ORDER_SERVICE_URL}/orders/",
                json=order
            )
            
            if not order_response.status_code == 200 and not order_response.status_code == 201:
                raise HTTPException(status_code=order_response.status_code, detail="Failed to create order")
            
            order_data = order_response.json()
            
            # Forward order to kitchen service
            kitchen_response = await client.post(
                f"{KITCHEN_SERVICE_URL}/orders/",
                json=order_data
            )
            
            if not kitchen_response.status_code == 200 and not kitchen_response.status_code == 201:
                # Log error but still return order data
                print(f"Error forwarding order to kitchen: {kitchen_response.status_code} - {kitchen_response.text}")
            
            return order_data
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}") 