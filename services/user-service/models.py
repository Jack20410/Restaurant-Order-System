from sqlalchemy import Column, Integer, String, Float, Enum
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

class UserRole(enum.Enum):
    WAITER = "waiter"
    KITCHEN = "kitchen"
    MANAGER = "manager"

class ShiftType(enum.Enum):
    DAY = "day"
    NIGHT = "night"

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    mail = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    shifts = Column(Enum(ShiftType), nullable=True)
