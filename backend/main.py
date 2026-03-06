import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, users, ai_connections, evaluation, questions, progress, validation
from database import create_tables

app = FastAPI(title="DSAForge API", version="1.0.0")

# Allow all Railway subdomains + local dev
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Railway handles SSL termination; fine for MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    create_tables()

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(ai_connections.router, prefix="/api/ai", tags=["ai"])
app.include_router(evaluation.router, prefix="/api/evaluation", tags=["evaluation"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(validation.router, prefix="/api/validation", tags=["validation"])

@app.get("/")
def root():
    return {"message": "DSAForge API running ⚡"}

@app.get("/health")
def health():
    return {"status": "ok"}
