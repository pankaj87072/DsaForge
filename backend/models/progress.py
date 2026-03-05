from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, JSON
from sqlalchemy.sql import func
from database import Base

class EvaluationResult(Base):
    __tablename__ = "evaluation_results"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    method = Column(String(20))  # "ai_quiz" or "self_report"
    raw_answers = Column(JSON, nullable=True)
    self_description = Column(Text, nullable=True)
    ai_assessment = Column(Text, nullable=True)
    assigned_level = Column(String(20))
    score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(String(50), nullable=False)
    level = Column(String(20))
    topic = Column(String(100))
    status = Column(String(20))  # solved, attempted, skipped
    time_taken_seconds = Column(Integer, nullable=True)
    attempts = Column(Integer, default=1)
    solved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LevelProgress(Base):
    __tablename__ = "level_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    beginner_solved = Column(Integer, default=0)
    beginner_unlocked = Column(Boolean, default=True)
    intermediate_solved = Column(Integer, default=0)
    intermediate_unlocked = Column(Boolean, default=False)
    advanced_solved = Column(Integer, default=0)
    advanced_unlocked = Column(Boolean, default=False)
    current_batch_start = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class UserInput(Base):
    __tablename__ = "user_inputs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    input_type = Column(String(50))  # evaluation_text, weakness_note, etc.
    content = Column(Text)
    meta_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
