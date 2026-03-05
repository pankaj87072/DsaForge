from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import json
from database import get_db
from models.user import User
from models.progress import EvaluationResult, UserInput, LevelProgress
from services.ai_connector import chat_with_ai
from routers.auth import get_current_user
from routers.ai_connections import get_user_token
from data.questions import get_quiz_questions

router = APIRouter()

def auth(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    return get_current_user(authorization[7:], db)

class QuizAnswers(BaseModel):
    answers: List[dict]  # [{question_id, selected_option}]
    self_description: Optional[str] = None

class SelfReportRequest(BaseModel):
    level: str
    self_description: Optional[str] = None

@router.get("/quiz")
def get_quiz():
    return get_quiz_questions()

@router.post("/submit-quiz")
async def submit_quiz(req: QuizAnswers, user: User = Depends(auth), db: Session = Depends(get_db)):
    questions = get_quiz_questions()
    q_map = {q["id"]: q for q in questions}
    
    score = 0
    level_scores = {"beginner": 0, "intermediate": 0, "advanced": 0}
    level_counts = {"beginner": 0, "intermediate": 0, "advanced": 0}
    
    for ans in req.answers:
        q = q_map.get(ans["question_id"])
        if q and ans.get("selected_option") == q["correct"]:
            score += 1
            level_scores[q["level_indicator"]] += 1
        if q:
            level_counts[q["level_indicator"]] += 1
    
    # Determine level
    total = len(req.answers)
    pct = score / total if total > 0 else 0
    
    token_info = get_user_token(user.id)
    ai_assessment = None
    
    if token_info and req.self_description:
        try:
            prompt = f"""A user is learning DSA. They scored {score}/{total} on a quiz ({pct*100:.0f}%).
Topic breakdown: {json.dumps(level_scores)}
Self description: "{req.self_description}"

Based on this, assign them one of: beginner, intermediate, or advanced.
Also give 2-3 sentences of personalized feedback.
Respond as JSON: {{"level": "...", "feedback": "..."}}"""
            resp = await chat_with_ai(token_info["provider"], token_info["token"], prompt)
            parsed = json.loads(resp.strip().replace("```json","").replace("```",""))
            assigned_level = parsed.get("level", _score_to_level(pct))
            ai_assessment = parsed.get("feedback", "")
        except:
            assigned_level = _score_to_level(pct)
    else:
        assigned_level = _score_to_level(pct)
    
    # Save
    eval_result = EvaluationResult(
        user_id=user.id,
        method="ai_quiz",
        raw_answers=req.answers,
        self_description=req.self_description,
        ai_assessment=ai_assessment,
        assigned_level=assigned_level,
        score=pct
    )
    db.add(eval_result)
    
    if req.self_description:
        inp = UserInput(user_id=user.id, input_type="quiz_description", content=req.self_description, meta_data={"score": pct})
        db.add(inp)
    
    user.level = assigned_level
    user.evaluation_done = True
    user.onboarding_complete = True
    
    lp = db.query(LevelProgress).filter(LevelProgress.user_id == user.id).first()
    if lp:
        if assigned_level in ["intermediate","advanced"]:
            lp.intermediate_unlocked = True
        if assigned_level == "advanced":
            lp.advanced_unlocked = True
    
    db.commit()
    return {"level": assigned_level, "score": score, "total": total, "feedback": ai_assessment}

@router.post("/self-report")
def self_report(req: SelfReportRequest, user: User = Depends(auth), db: Session = Depends(get_db)):
    if req.level not in ["beginner","intermediate","advanced"]:
        raise HTTPException(status_code=400, detail="Invalid level")
    
    eval_result = EvaluationResult(
        user_id=user.id,
        method="self_report",
        self_description=req.self_description,
        assigned_level=req.level
    )
    db.add(eval_result)
    
    if req.self_description:
        inp = UserInput(user_id=user.id, input_type="self_description_onboarding", content=req.self_description)
        db.add(inp)
    
    user.level = req.level
    user.evaluation_done = True
    user.onboarding_complete = True
    user.self_description = req.self_description
    
    lp = db.query(LevelProgress).filter(LevelProgress.user_id == user.id).first()
    if lp:
        if req.level in ["intermediate","advanced"]:
            lp.intermediate_unlocked = True
        if req.level == "advanced":
            lp.advanced_unlocked = True
    
    db.commit()
    return {"success": True, "level": req.level}

def _score_to_level(pct: float) -> str:
    if pct >= 0.7:
        return "advanced"
    elif pct >= 0.4:
        return "intermediate"
    return "beginner"
