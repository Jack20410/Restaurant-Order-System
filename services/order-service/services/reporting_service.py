from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from database_orders import get_db_connection

class ReportingService:
    @staticmethod
    def get_shift_receipts(employee_id: int, shift_date: date) -> Dict[str, Any]:
        """
        Sum all receipts created by an employee in their shift on a specific date
        """
        connection = get_db_connection()
        if not connection:
            raise Exception("Database connection failed")
        
        try:
            cursor = connection.cursor(dictionary=True)
            
            # Calculate shift start and end (default to full day if shift info not provided)
            shift_start = datetime.combine(shift_date, datetime.min.time())
            shift_end = datetime.combine(shift_date, datetime.max.time())
            
            query = """
            SELECT 
                COUNT(p.payment_id) as total_receipts,
                SUM(p.amount) as total_amount,
                COUNT(DISTINCT o.order_id) as total_orders
            FROM 
                payments p
            JOIN 
                orders o ON p.order_id = o.order_id
            WHERE 
                o.employee_id = %s
                AND p.created_at BETWEEN %s AND %s
            """
            
            cursor.execute(query, (employee_id, shift_start, shift_end))
            summary = cursor.fetchone()
            
            # Get detailed list of receipts
            detail_query = """
            SELECT 
                p.payment_id,
                p.order_id,
                p.amount,
                p.payment_type,
                p.created_at,
                o.total_price
            FROM 
                payments p
            JOIN 
                orders o ON p.order_id = o.order_id
            WHERE 
                o.employee_id = %s
                AND p.created_at BETWEEN %s AND %s
            ORDER BY 
                p.created_at DESC
            """
            
            cursor.execute(detail_query, (employee_id, shift_start, shift_end))
            receipts = cursor.fetchall()
            
            return {
                "summary": summary,
                "receipts": receipts,
                "shift_date": shift_date.isoformat(),
                "employee_id": employee_id
            }
        finally:
            connection.close()
    
    @staticmethod
    def get_daily_receipts(target_date: date) -> Dict[str, Any]:
        """
        Get receipt summary for a specific date
        """
        connection = get_db_connection()
        if not connection:
            raise Exception("Database connection failed")
        
        try:
            cursor = connection.cursor(dictionary=True)
            
            # Set day start and end
            day_start = datetime.combine(target_date, datetime.min.time())
            day_end = datetime.combine(target_date, datetime.max.time())
            
            # Get summary of receipts for the day
            query = """
            SELECT 
                COUNT(p.payment_id) as total_receipts,
                SUM(p.amount) as total_amount,
                COUNT(DISTINCT o.order_id) as total_orders,
                COUNT(DISTINCT o.employee_id) as total_employees
            FROM 
                payments p
            JOIN 
                orders o ON p.order_id = o.order_id
            WHERE 
                p.created_at BETWEEN %s AND %s
            """
            
            cursor.execute(query, (day_start, day_end))
            summary = cursor.fetchone()
            
            # Get receipts grouped by payment type
            payment_type_query = """
            SELECT 
                p.payment_type,
                COUNT(p.payment_id) as count,
                SUM(p.amount) as total
            FROM 
                payments p
            WHERE 
                p.created_at BETWEEN %s AND %s
            GROUP BY 
                p.payment_type
            """
            
            cursor.execute(payment_type_query, (day_start, day_end))
            payment_types = cursor.fetchall()
            
            # Get receipts grouped by employee
            employee_query = """
            SELECT 
                o.employee_id,
                COUNT(p.payment_id) as receipt_count,
                SUM(p.amount) as total_amount
            FROM 
                payments p
            JOIN 
                orders o ON p.order_id = o.order_id
            WHERE 
                p.created_at BETWEEN %s AND %s
            GROUP BY 
                o.employee_id
            ORDER BY 
                total_amount DESC
            """
            
            cursor.execute(employee_query, (day_start, day_end))
            employees = cursor.fetchall()
            
            return {
                "date": target_date.isoformat(),
                "summary": summary,
                "payment_types": payment_types,
                "employees": employees
            }
        finally:
            connection.close()
    
    @staticmethod
    def get_monthly_receipts(year: int, month: int) -> Dict[str, Any]:
        """
        Get receipt summary for a specific month
        """
        connection = get_db_connection()
        if not connection:
            raise Exception("Database connection failed")
        
        try:
            cursor = connection.cursor(dictionary=True)
            
            # Calculate first and last day of month
            first_day = date(year, month, 1)
            if month == 12:
                last_day = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                last_day = date(year, month + 1, 1) - timedelta(days=1)
            
            month_start = datetime.combine(first_day, datetime.min.time())
            month_end = datetime.combine(last_day, datetime.max.time())
            
            # Get monthly summary
            query = """
            SELECT 
                COUNT(p.payment_id) as total_receipts,
                SUM(p.amount) as total_amount,
                COUNT(DISTINCT o.order_id) as total_orders
            FROM 
                payments p
            JOIN 
                orders o ON p.order_id = o.order_id
            WHERE 
                p.created_at BETWEEN %s AND %s
            """
            
            cursor.execute(query, (month_start, month_end))
            summary = cursor.fetchone()
            
            # Get daily breakdown
            daily_query = """
            SELECT 
                DATE(p.created_at) as day,
                COUNT(p.payment_id) as receipt_count,
                SUM(p.amount) as daily_total
            FROM 
                payments p
            WHERE 
                p.created_at BETWEEN %s AND %s
            GROUP BY 
                DATE(p.created_at)
            ORDER BY 
                day
            """
            
            cursor.execute(daily_query, (month_start, month_end))
            daily_breakdown = cursor.fetchall()
            
            return {
                "year": year,
                "month": month,
                "summary": summary,
                "daily_breakdown": daily_breakdown
            }
        finally:
            connection.close()
    
    @staticmethod
    def get_yearly_receipts(year: int) -> Dict[str, Any]:
        """
        Get receipt summary for a specific year
        """
        connection = get_db_connection()
        if not connection:
            raise Exception("Database connection failed")
        
        try:
            cursor = connection.cursor(dictionary=True)
            
            # Calculate year start and end
            year_start = datetime(year, 1, 1)
            year_end = datetime(year, 12, 31, 23, 59, 59)
            
            # Get yearly summary
            query = """
            SELECT 
                COUNT(p.payment_id) as total_receipts,
                SUM(p.amount) as total_amount,
                COUNT(DISTINCT o.order_id) as total_orders
            FROM 
                payments p
            JOIN 
                orders o ON p.order_id = o.order_id
            WHERE 
                p.created_at BETWEEN %s AND %s
            """
            
            cursor.execute(query, (year_start, year_end))
            summary = cursor.fetchone()
            
            # Get monthly breakdown
            monthly_query = """
            SELECT 
                MONTH(p.created_at) as month,
                COUNT(p.payment_id) as receipt_count,
                SUM(p.amount) as monthly_total
            FROM 
                payments p
            WHERE 
                p.created_at BETWEEN %s AND %s
            GROUP BY 
                MONTH(p.created_at)
            ORDER BY 
                month
            """
            
            cursor.execute(monthly_query, (year_start, year_end))
            monthly_breakdown = cursor.fetchall()
            
            return {
                "year": year,
                "summary": summary,
                "monthly_breakdown": monthly_breakdown
            }
        finally:
            connection.close() 