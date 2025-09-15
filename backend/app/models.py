from sqlalchemy import Column, Integer, String
from .database import Base

class ExcelFile(Base):
    __tablename__ = "excel_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
