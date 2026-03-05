from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    level = Column(String(20), default="beginner")  # beginner, intermediate, advanced
    self_description = Column(Text, nullable=True)
    onboarding_complete = Column(Boolean, default=False)
    ai_connected = Column(Boolean, default=False)
    evaluation_done = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
