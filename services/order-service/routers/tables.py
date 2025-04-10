from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database_orders import get_db_connection
from models import Table
from typing import List
from pydantic import BaseModel

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

# Initialize tables if they don't exist
@router.post("/init", response_model=List[TableResponse])
def initialize_tables(db: Session = Depends(get_db_connection)):
    # Check if tables already exist
    existing_tables = db.query(Table).all()
    if existing_tables:
        return existing_tables
    
    # Create 10 tables
    tables = []
    for i in range(1, 11):
        table = Table(table_status='available')
        db.add(table)
        tables.append(table)
    
    db.commit()
    for table in tables:
        db.refresh(table)
    
    return tables 