from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json
from database import get_db
from models.user import User
from models.progress import UserProgress, LevelProgress, UserInput
from services.ai_connector import chat_with_ai
from services.adaptive_algorithm import (
    compute_adaptive_report, compute_company_clearance
)
from routers.auth import get_current_user
from routers.ai_connections import get_user_token
from data.questions import get_questions_by_level
from data.companies import LEVEL_UNLOCK_REQUIREMENTS, get_all_companies

router = APIRouter()
BATCH_SIZE = 10


def auth(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    return get_current_user(authorization[7:], db)


class SubmitProgressRequest(BaseModel):
    question_id: str
    level: str
    topic: str
    status: str
    time_taken_seconds: Optional[int] = None


@router.post("/submit")
async def submit_progress(req: SubmitProgressRequest, user: User = Depends(auth), db: Session = Depends(get_db)):
    existing = db.query(UserProgress).filter(
        UserProgress.user_id == user.id,
        UserProgress.question_id == req.question_id
    ).first()

    if existing:
        existing.status = req.status
        existing.attempts += 1
        if req.status == "solved":
            existing.solved_at = datetime.utcnow()
        if req.time_taken_seconds:
            existing.time_taken_seconds = req.time_taken_seconds
    else:
        prog = UserProgress(
            user_id=user.id,
            question_id=req.question_id,
            level=req.level,
            topic=req.topic,
            status=req.status,
            time_taken_seconds=req.time_taken_seconds,
            solved_at=datetime.utcnow() if req.status == "solved" else None
        )
        db.add(prog)

    db.commit()

    lp = db.query(LevelProgress).filter(LevelProgress.user_id == user.id).first()
    if lp:
        solved_count = db.query(UserProgress).filter(
            UserProgress.user_id == user.id,
            UserProgress.level == req.level,
            UserProgress.status == "solved"
        ).count()
        if req.level == "beginner":
            lp.beginner_solved = solved_count
        elif req.level == "intermediate":
            lp.intermediate_solved = solved_count
        elif req.level == "advanced":
            lp.advanced_solved = solved_count
        db.commit()

    unlock_info = await _check_unlock(user, req.level, db)

    batch_feedback = None
    if lp:
        current_solved = getattr(lp, f"{req.level}_solved", 0)
        if current_solved > 0 and current_solved % BATCH_SIZE == 0:
            batch_feedback = await _generate_batch_feedback(user, req.level, db)

    return {"success": True, "unlock_info": unlock_info, "batch_feedback": batch_feedback}


@router.get("/summary")
def get_summary(user: User = Depends(auth), db: Session = Depends(get_db)):
    lp = db.query(LevelProgress).filter(LevelProgress.user_id == user.id).first()
    all_progress = db.query(UserProgress).filter(UserProgress.user_id == user.id).all()

    topics = {}
    for p in all_progress:
        if p.topic not in topics:
            topics[p.topic] = {"solved": 0, "attempted": 0, "skipped": 0}
        topics[p.topic][p.status] = topics[p.topic].get(p.status, 0) + 1

    return {
        "level_progress": {
            "beginner": {"solved": lp.beginner_solved if lp else 0, "unlocked": lp.beginner_unlocked if lp else True},
            "intermediate": {"solved": lp.intermediate_solved if lp else 0, "unlocked": lp.intermediate_unlocked if lp else False},
            "advanced": {"solved": lp.advanced_solved if lp else 0, "unlocked": lp.advanced_unlocked if lp else False},
        },
        "topics": topics,
        "total_solved": sum(1 for p in all_progress if p.status == "solved"),
        "current_level": user.level
    }


@router.get("/my-questions/{level}")
def get_my_question_statuses(level: str, user: User = Depends(auth), db: Session = Depends(get_db)):
    """Returns {question_id: status} for all questions user has touched at this level."""
    records = db.query(UserProgress).filter(
        UserProgress.user_id == user.id,
        UserProgress.level == level
    ).all()
    return {r.question_id: r.status for r in records}


@router.get("/adaptive-report")
def get_adaptive_report(user: User = Depends(auth), db: Session = Depends(get_db)):
    """Full adaptive analysis - no AI needed."""
    level = user.level
    all_progress = db.query(UserProgress).filter(
        UserProgress.user_id == user.id,
        UserProgress.level == level
    ).all()

    all_questions = get_questions_by_level(level)

    if not all_progress:
        return {
            "overall_score": 0,
            "readiness_label": "Just Getting Started 🚀",
            "topic_mastery": [],
            "weak_topics": [],
            "strong_topics": [],
            "next_recommended_topics": list(set(q["topic"] for q in all_questions[:6])),
            "improvement_tips": {},
            "questions_to_prioritize": [q["id"] for q in all_questions[:5]],
            "level_progression_pct": 0,
        }

    report = compute_adaptive_report(level, all_progress, all_questions)

    return {
        "overall_score": report.overall_score,
        "readiness_label": report.readiness_label,
        "topic_mastery": [
            {
                "topic": m.topic,
                "mastery_score": m.mastery_score,
                "solve_rate": m.solve_rate,
                "coverage": m.coverage,
                "speed_score": m.speed_score,
                "consistency_score": m.consistency_score,
                "solved": m.solved,
                "attempted": m.attempted,
                "label": m.label,
                "priority": m.priority,
            }
            for m in report.topic_mastery
        ],
        "weak_topics": report.weak_topics,
        "strong_topics": report.strong_topics,
        "next_recommended_topics": report.next_recommended_topics,
        "improvement_tips": report.improvement_tips,
        "questions_to_prioritize": report.questions_to_prioritize,
        "level_progression_pct": report.level_progression_pct,
    }


@router.get("/smart-companies")
def get_smart_companies(user: User = Depends(auth), db: Session = Depends(get_db)):
    """
    Returns companies clearable based on ACTUAL mastery scores.
    Returns 0 companies when user has no progress.
    """
    all_progress = db.query(UserProgress).filter(UserProgress.user_id == user.id).all()
    all_companies_list = get_all_companies()

    if not all_progress:
        return {"clearable": [], "all_companies": all_companies_list}

    level_progress = [p for p in all_progress if p.level == user.level]
    if not level_progress:
        return {"clearable": [], "all_companies": all_companies_list}

    all_questions = get_questions_by_level(user.level)
    report = compute_adaptive_report(user.level, level_progress, all_questions)
    topic_mastery_map = {m.topic: m.mastery_score for m in report.topic_mastery}

    clearable = compute_company_clearance(user.level, topic_mastery_map, all_companies_list)
    return {
        "clearable": clearable,
        "all_companies": all_companies_list,
        "topic_mastery_map": topic_mastery_map,
    }


async def _check_unlock(user: User, level: str, db: Session):
    lp = db.query(LevelProgress).filter(LevelProgress.user_id == user.id).first()
    if not lp:
        return None

    req_map = {
        "beginner": ("beginner_to_intermediate", "intermediate_unlocked", "intermediate"),
        "intermediate": ("intermediate_to_advanced", "advanced_unlocked", "advanced"),
    }
    if level not in req_map:
        return None

    req_key, unlock_field, next_level = req_map[level]
    reqs = LEVEL_UNLOCK_REQUIREMENTS[req_key]

    solved = db.query(UserProgress).filter(
        UserProgress.user_id == user.id,
        UserProgress.level == level,
        UserProgress.status == "solved"
    ).count()
    total_attempted = db.query(UserProgress).filter(
        UserProgress.user_id == user.id,
        UserProgress.level == level,
        UserProgress.status.in_(["solved", "attempted"])
    ).count()

    rate = solved / total_attempted if total_attempted > 0 else 0

    if solved >= reqs["min_solved"] and rate >= reqs["min_success_rate"]:
        if not getattr(lp, unlock_field):
            setattr(lp, unlock_field, True)
            db.commit()
            return {"unlocked": next_level, "message": f"🎉 {next_level.title()} level unlocked!"}

    return {"progress": f"{solved}/{reqs['min_solved']} solved, {rate * 100:.0f}% rate"}


async def _generate_batch_feedback(user: User, level: str, db: Session):
    token_info = get_user_token(user.id)
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == user.id,
        UserProgress.level == level
    ).all()

    all_questions = get_questions_by_level(level)
    report = compute_adaptive_report(level, progress, all_questions)

    internal_result = {
        "weaknesses": report.weak_topics[:2] if report.weak_topics else [],
        "advice": _format_advice(report),
        "overall_score": report.overall_score,
        "readiness_label": report.readiness_label,
        "tips": {t: report.improvement_tips.get(t, "") for t in report.weak_topics[:2]},
        "source": "internal"
    }

    if token_info and report.weak_topics:
        try:
            topic_stats_summary = {
                m.topic: {"mastery": m.mastery_score, "solve_rate": m.solve_rate}
                for m in report.topic_mastery
            }
            prompt = f"""DSA learner at {level} level. Score: {report.overall_score}/100. Weak areas: {report.weak_topics}. Topic data: {json.dumps(topic_stats_summary)}. Give 2 sentences of specific actionable advice. Format: {{"advice": "..."}}"""
            resp = await chat_with_ai(token_info["provider"], token_info["token"], prompt)
            parsed = json.loads(resp.strip().replace("```json", "").replace("```", ""))
            internal_result["advice"] = parsed.get("advice", internal_result["advice"])
            internal_result["source"] = "ai_enhanced"
        except:
            pass

    return internal_result


def _format_advice(report) -> str:
    if not report.weak_topics:
        if report.overall_score >= 75:
            return f"Excellent! Score {report.overall_score}/100. Work on speed now — aim for mediums under 15 min."
        return "Keep going! More questions = clearer patterns."
    weak = report.weak_topics[0]
    score_val = next((m.mastery_score for m in report.topic_mastery if m.topic == weak), 0)
    tip = report.improvement_tips.get(weak, "Practice more questions in this topic.")
    return f"Weakest area: {weak} ({score_val}/100). {tip}"
