from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database_orders import SessionLocal
from models import Table
from typing import List
from pydantic import BaseModel
from sqlalchemy import text

router = APIRouter()

class TableBase(BaseModel):
    table_status: str = 'available'

class TableCreate(TableBase):
    pass

class TableResponse(TableBase):
    table_id: int
    table_status: str

    class Config:
        orm_mode = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_all_tables(db: Session = Depends(get_db)):
    """Get all tables regardless of their status"""
    try:
        tables = db.query(Table).all()
        if not tables:
            raise HTTPException(status_code=404, detail="No tables found")
            
        return [{"table_id": table.table_id, "table_status": table.table_status} for table in tables]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/available")
def get_available_tables(db: Session = Depends(get_db)):
    """Get only available tables"""
    try:
        tables = db.query(Table).filter(Table.table_status == 'available').all()
        if not tables:
            raise HTTPException(status_code=404, detail="No available tables found")
            
        return [{"table_id": table.table_id, "table_status": table.table_status} for table in tables]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{table_id}", response_model=TableResponse)
def update_table_status(table_id: int, table_data: TableBase, db: Session = Depends(get_db)):
    table = db.query(Table).filter(Table.table_id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    table.table_status = table_data.table_status
    db.commit()
    db.refresh(table)
    return table

# Initialize tables if they don't exist or if count < 10
@router.post("/init", response_model=List[TableResponse])
def initialize_tables(db: Session = Depends(get_db), _: None = Body(None, include_in_schema=False)):
    # Create 10 fresh tables
    tables = [Table(table_status='available') for _ in range(10)]
    db.bulk_save_objects(tables)
    db.commit()
    
    # Fetch all tables in one query
    return db.query(Table).all() 