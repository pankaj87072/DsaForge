from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.user import User
from routers.auth import get_current_user

router = APIRouter()

def auth(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    return get_current_user(authorization[7:], db)

class UpdateLevelRequest(BaseModel):
    level: str
    self_description: Optional[str] = None

@router.get("/me")
def get_me(user: User = Depends(auth), db: Session = Depends(get_db)):
    return {
        "id": user.id,
        "username": user.username,
        "level": user.level,
        "ai_connected": user.ai_connected,
        "onboarding_complete": user.onboarding_complete,
        "evaluation_done": user.evaluation_done,
        "self_description": user.self_description,
        "created_at": user.created_at
    }

@router.put("/level")
def update_level(req: UpdateLevelRequest, user: User = Depends(auth), db: Session = Depends(get_db)):
    if req.level not in ["beginner", "intermediate", "advanced"]:
        raise HTTPException(status_code=400, detail="Invalid level")
    user.level = req.level
    if req.self_description:
        user.self_description = req.self_description
    user.onboarding_complete = True
    db.commit()
    return {"success": True, "level": user.level}

@router.put("/self-description")
def save_description(body: dict, user: User = Depends(auth), db: Session = Depends(get_db)):
    from models.progress import UserInput
    text = body.get("text", "")
    user.self_description = text
    inp = UserInput(user_id=user.id, input_type="self_description", content=text)
    db.add(inp)
    db.commit()
    return {"success": True}

@router.put("/complete-onboarding")
def complete_onboarding(user: User = Depends(auth), db: Session = Depends(get_db)):
    user.onboarding_complete = True
    db.commit()
    return {"success": True}
