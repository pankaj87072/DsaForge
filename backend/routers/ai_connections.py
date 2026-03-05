from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import hashlib
from database import get_db
from models.user import User
from models.ai_connection import AIConnection
from services.ai_connector import verify_connection, get_providers_list
from routers.auth import get_current_user

router = APIRouter()

def auth(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    return get_current_user(authorization[7:], db)

class ConnectAIRequest(BaseModel):
    provider: str
    token: str

@router.get("/providers")
def list_providers():
    return get_providers_list()

@router.post("/connect")
async def connect_ai(req: ConnectAIRequest, user: User = Depends(auth), db: Session = Depends(get_db)):
    result = await verify_connection(req.provider, req.token)
    if not result["success"]:
        return {"success": False, "error": result["error"]}
    
    # Store hashed token (never store plain token)
    token_hash = hashlib.sha256(req.token.encode()).hexdigest()
    preview = req.token[:4] + "..." + req.token[-4:] if len(req.token) > 8 else "****"
    
    # Deactivate old connections for this user+provider
    db.query(AIConnection).filter(
        AIConnection.user_id == user.id,
        AIConnection.provider == req.provider
    ).update({"is_active": False})
    
    conn = AIConnection(
        user_id=user.id,
        provider=req.provider,
        token_hash=token_hash,
        token_preview=preview,
        is_active=True
    )
    db.add(conn)
    user.ai_connected = True
    
    # Store encrypted token for actual API calls (in real prod use vault/KMS)
    # For demo: store in session cache keyed by user_id
    _token_cache[user.id] = {"provider": req.provider, "token": req.token}
    
    db.commit()
    return {"success": True, "provider": req.provider, "preview": preview}

@router.get("/status")
def connection_status(user: User = Depends(auth), db: Session = Depends(get_db)):
    conn = db.query(AIConnection).filter(
        AIConnection.user_id == user.id,
        AIConnection.is_active == True
    ).first()
    if not conn:
        return {"connected": False}
    return {
        "connected": True,
        "provider": conn.provider,
        "preview": conn.token_preview,
        "since": conn.created_at
    }

@router.delete("/disconnect")
def disconnect(user: User = Depends(auth), db: Session = Depends(get_db)):
    db.query(AIConnection).filter(
        AIConnection.user_id == user.id,
        AIConnection.is_active == True
    ).update({"is_active": False})
    user.ai_connected = False
    _token_cache.pop(user.id, None)
    db.commit()
    return {"success": True}

# In-memory token cache (use Redis in production)
_token_cache: dict = {}

def get_user_token(user_id: int):
    return _token_cache.get(user_id)
