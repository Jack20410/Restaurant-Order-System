from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import calendar
from typing import Literal
from database_orders import get_db_connection
from models import OrderCompleted, CompletedOrderItem

router = APIRouter(
    tags=["Reports"]
)

@router.get("/revenue/{time_range}")
async def get_revenue(
    time_range: Literal["week", "month", "year"], 
    db: Session = Depends(get_db_connection)
):
    """Get revenue data for the specified time range"""
    try:
        now = datetime.now()
        
        if time_range == "week":
            # Get start of current week (Monday)
            start_date = now - timedelta(days=now.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Query daily revenue for the week
            results = db.query(
                func.date(OrderCompleted.completed_at).label('date'),
                func.coalesce(func.sum(OrderCompleted.total_price), 0).label('revenue')
            ).filter(
                OrderCompleted.completed_at >= start_date
            ).group_by(
                func.date(OrderCompleted.completed_at)
            ).all()
            
            # Create a list for all 7 days
            revenue_data = []
            for i in range(7):
                date = start_date + timedelta(days=i)
                revenue = next(
                    (r.revenue for r in results if r.date == date.date()),
                    0
                )
                revenue_data.append({
                    "date": date.strftime("%d/%m"),
                    "revenue": float(revenue or 0)
                })
            
            return revenue_data

        elif time_range == "month":
            # Get start of current month
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Get weekly revenue for the month using MySQL's YEARWEEK function
            results = db.query(
                func.yearweek(OrderCompleted.completed_at).label('week'),
                func.coalesce(func.sum(OrderCompleted.total_price), 0).label('revenue')
            ).filter(
                OrderCompleted.completed_at >= start_date
            ).group_by(
                func.yearweek(OrderCompleted.completed_at)
            ).all()
            
            # Create weekly ranges
            revenue_data = []
            current_date = start_date
            while current_date.month == start_date.month:
                week_end = min(
                    current_date + timedelta(days=6),
                    start_date.replace(day=calendar.monthrange(start_date.year, start_date.month)[1])
                )
                
                # Find revenue for the current week
                week_number = int(current_date.strftime('%Y%W'))
                revenue = next(
                    (r.revenue for r in results if r.week == week_number),
                    0
                )
                
                revenue_data.append({
                    "date": f"{current_date.strftime('%d/%m')}-{week_end.strftime('%d/%m')}",
                    "revenue": float(revenue or 0)
                })
                
                current_date += timedelta(days=7)
                if current_date.day < 7 and current_date.month != start_date.month:
                    break
            
            return revenue_data

        elif time_range == "year":
            # Get start of current year
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Query monthly revenue for the year using MySQL's MONTH and YEAR functions
            results = db.query(
                func.month(OrderCompleted.completed_at).label('month'),
                func.coalesce(func.sum(OrderCompleted.total_price), 0).label('revenue')
            ).filter(
                OrderCompleted.completed_at >= start_date
            ).group_by(
                func.month(OrderCompleted.completed_at)
            ).all()
            
            # Create a list for all 12 months
            revenue_data = []
            for month in range(1, 13):
                date = start_date.replace(month=month)
                revenue = next(
                    (r.revenue for r in results if r.month == month),
                    0
                )
                revenue_data.append({
                    "date": date.strftime("%m/%Y"),
                    "revenue": float(revenue or 0)
                })
            
            return revenue_data

        raise HTTPException(status_code=422, detail="Invalid time range. Must be 'week', 'month', or 'year'.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/total-sales")
async def get_total_sales(db: Session = Depends(get_db_connection)):
    """Get the total sales (revenue) from all completed orders"""
    try:
        total_sales = db.query(
            func.coalesce(func.sum(OrderCompleted.total_price), 0)
        ).scalar()
        
        return {
            "total_sales": float(total_sales or 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/total-customers")
async def get_total_customers(db: Session = Depends(get_db_connection)):
    """Get the total number of unique customers based on their phone numbers"""
    try:
        total_customers = db.query(
            func.count(func.distinct(OrderCompleted.customer_phone))
        ).scalar()
        
        return {
            "total_customers": int(total_customers or 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/total-orders")
async def get_total_orders(db: Session = Depends(get_db_connection)):
    """Get the total number of completed orders"""
    try:
        total_orders = db.query(
            func.count(OrderCompleted.order_completed_id)
        ).scalar()
        
        return {
            "total_orders": int(total_orders or 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/top-foods")
async def get_top_foods(db: Session = Depends(get_db_connection)):
    """Get the top 5 most ordered foods based on total quantity"""
    try:
        # Query to get top 5 foods by total quantity ordered
        results = db.query(
            CompletedOrderItem.food_id,
            func.sum(CompletedOrderItem.quantity).label('total_quantity'),
            func.count(CompletedOrderItem.completed_order_item_id).label('order_count')
        ).group_by(
            CompletedOrderItem.food_id
        ).order_by(
            func.sum(CompletedOrderItem.quantity).desc()
        ).limit(5).all()
        
        # Format the results with just food_id
        top_foods = [
            {
                "food_id": result.food_id,
                "total_quantity": int(result.total_quantity),
                "order_count": int(result.order_count)
            }
            for result in results
        ]
        
        return {
            "top_foods": top_foods
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/dashboard-summary")
async def get_dashboard_summary(db: Session = Depends(get_db_connection)):
    """Get a complete dashboard summary including statistics and top foods"""
    try:
        # Get basic statistics
        stats = db.query(
            func.coalesce(func.sum(OrderCompleted.total_price), 0).label('total_sales'),
            func.count(func.distinct(OrderCompleted.customer_phone)).label('total_customers'),
            func.count(OrderCompleted.order_completed_id).label('total_orders')
        ).first()
        
        # Get top 5 foods
        top_foods_query = db.query(
            CompletedOrderItem.food_id,
            func.sum(CompletedOrderItem.quantity).label('total_quantity'),
            func.count(CompletedOrderItem.completed_order_item_id).label('order_count')
        ).group_by(
            CompletedOrderItem.food_id
        ).order_by(
            func.sum(CompletedOrderItem.quantity).desc()
        ).limit(5).all()
        
        return {
            "statistics": {
                "total_sales": float(stats.total_sales or 0),
                "total_customers": int(stats.total_customers or 0),
                "total_orders": int(stats.total_orders or 0)
            },
            "top_foods": [
                {
                    "food_id": food.food_id,
                    "total_quantity": int(food.total_quantity),
                    "order_count": int(food.order_count)
                }
                for food in top_foods_query
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics/employee-summary")
async def get_employee_summary(db: Session = Depends(get_db_connection)):
    """Get a summary of receipts/orders created by each employee"""
    try:
        # Query to get summary statistics for each employee
        results = db.query(
            OrderCompleted.employee_id,
            func.count(OrderCompleted.order_completed_id).label('total_orders'),
            func.coalesce(func.sum(OrderCompleted.total_price), 0).label('total_revenue'),
            func.coalesce(func.avg(OrderCompleted.total_price), 0).label('average_order_value')
        ).group_by(
            OrderCompleted.employee_id
        ).order_by(
            func.count(OrderCompleted.order_completed_id).desc()
        ).all()
        
        # Format the results
        employee_summaries = [
            {
                "employee_id": result.employee_id,
                "total_orders": int(result.total_orders),
                "total_revenue": float(result.total_revenue),
                "average_order_value": round(float(result.average_order_value), 2)
            }
            for result in results
        ]
        
        return {
            "employee_summaries": employee_summaries
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
