from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.validation import IdeaValidation
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter()

class ValidationCreate(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    pricing_plan: Optional[str] = None
    custom_amount: Optional[float] = None

@router.post("/submit")
def submit_validation(data: ValidationCreate, db: Session = Depends(get_db)):
    try:
        new_entry = IdeaValidation(
            email=data.email,
            phone=data.phone,
            pricing_plan=data.pricing_plan,
            custom_amount=data.custom_amount
        )
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        return {"message": "Success! You've been added to the waitlist.", "id": new_entry.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    # Optional: admin tool to see interest
    count = db.query(IdeaValidation).count()
    return {"total_interested": count}
