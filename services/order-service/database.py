from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker

# Cập nhật DATABASE_URL với username và password là root
DATABASE_URL = "mysql+pymysql://root:root@localhost/restaurant_db"

# Tạo engine để kết nối với database
engine = create_engine(DATABASE_URL)

# Tạo session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Tạo metadata để quản lý schema
metadata = MetaData()

# Hàm khởi tạo database (tạo các bảng nếu chưa tồn tại)
def init_db():
    metadata.create_all(engine)

# Hàm để lấy session (dùng trong dependency injection)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()