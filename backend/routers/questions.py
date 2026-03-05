from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.progress import LevelProgress
from routers.auth import get_current_user
from data.questions import get_questions_by_level, get_question_by_id
from data.companies import get_clearable_companies, get_all_companies

router = APIRouter()

def auth(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Missing token")
    return get_current_user(authorization[7:], db)

@router.get("/level/{level}")
def get_questions(level: str, user: User = Depends(auth), db: Session = Depends(get_db)):
    lp = db.query(LevelProgress).filter(LevelProgress.user_id == user.id).first()
    locked = False
    if level == "intermediate" and lp and not lp.intermediate_unlocked:
        locked = True
    if level == "advanced" and lp and not lp.advanced_unlocked:
        locked = True
    
    questions = get_questions_by_level(level)
    return {"questions": questions, "locked": locked, "level": level}

@router.get("/companies")
def companies(user: User = Depends(auth)):
    return get_all_companies()

@router.get("/clearable-companies")
def clearable(user: User = Depends(auth), db: Session = Depends(get_db)):
    from models.progress import UserProgress
    solved = db.query(UserProgress).filter(
        UserProgress.user_id == user.id,
        UserProgress.status == "solved"
    ).all()
    topics = list(set(s.topic for s in solved))
    return get_clearable_companies(user.level, topics)
