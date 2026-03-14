from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any
import os
from database import get_db
from models.db_models import Visit, DebateSession

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Secure Admin Password from Environment
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "clarivox-admin-secret-1234")

class LoginRequest(BaseModel):
    password: str

@router.post("/login")
async def admin_login(request: LoginRequest):
    """Simple password verification for the admin panel."""
    # In a real app we'd issue a JWT, but a simple boolean success is enough 
    # for a single-admin local-first tool for simplicity.
    if request.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )
    return {"status": "success", "token": "admin-auth-token-valid"}

@router.post("/track-visit")
async def track_visit(db: Session = Depends(get_db)):
    """Public endpoint called when the homepage mounts to track a unique visit."""
    visit = Visit()
    db.add(visit)
    db.commit()
    return {"status": "tracked"}

@router.get("/stats")
async def get_admin_stats(token: str = None, db: Session = Depends(get_db)):
    """Returns analytics data (requires simple token validation)."""
    if token != "admin-auth-token-valid":
        raise HTTPException(status_code=401, detail="Unauthorized")

    total_visits = db.query(func.count(Visit.id)).scalar()
    total_debates = db.query(func.count(DebateSession.id)).scalar()

    # Get breakdown by mode
    modes = db.query(DebateSession.mode, func.count(DebateSession.id)).group_by(DebateSession.mode).all()
    mode_distribution = {mode: count for mode, count in modes if mode}

    recent_debates = db.query(DebateSession).order_by(DebateSession.timestamp.desc()).limit(10).all()

    return {
        "total_visits": total_visits,
        "total_debates": total_debates,
        "mode_distribution": mode_distribution,
        "recent_debates": [
            {
                "id": d.id,
                "topic": d.topic,
                "mode": d.mode,
                "winner": d.winner,
                "score": d.overall_score,
                "timestamp": d.timestamp
            } for d in recent_debates
        ]
    }
