from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database_orders import get_db_connection
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

@router.get("/", response_model=List[TableResponse])
def get_all_tables(db: Session = Depends(get_db_connection)):
    return db.query(Table).all()

@router.put("/{table_id}", response_model=TableResponse)
def update_table_status(table_id: int, table_data: TableBase, db: Session = Depends(get_db_connection)):
    table = db.query(Table).filter(Table.table_id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    table.table_status = table_data.table_status
    db.commit()
    db.refresh(table)
    return table

# Initialize tables if they don't exist or if count < 10
@router.post("/init", response_model=List[TableResponse])
def initialize_tables(db: Session = Depends(get_db_connection), _: None = Body(None, include_in_schema=False)):
    # Create 10 fresh tables
    tables = [Table(table_status='available') for _ in range(10)]
    db.bulk_save_objects(tables)
    db.commit()
    
    # Fetch all tables in one query
    return db.query(Table).all() 