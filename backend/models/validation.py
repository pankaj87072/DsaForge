from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class IdeaValidation(Base):
    __tablename__ = "idea_validation"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    phone = Column(String, nullable=True)
    pricing_plan = Column(String, nullable=True) # "1_month", "3_months", "6_months", "lifetime"
    custom_amount = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
