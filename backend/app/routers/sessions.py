"""会话 CRUD API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.database import get_db
from app.schemas.session import SessionCreate, SessionUpdate, SessionResponse
from app.schemas.message import MessageResponse
from app.services.session_service import (
    get_sessions,
    create_session,
    get_session,
    delete_session,
    update_session,
    get_messages,
)

router = APIRouter(prefix="/api", tags=["sessions"])


@router.get("/sessions", response_model=list[SessionResponse])
def list_sessions(db: DBSession = Depends(get_db)):
    return get_sessions(db)


@router.post("/sessions", response_model=SessionResponse)
def create_new_session(db: DBSession = Depends(get_db)):
    return create_session(db)


@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session_detail(session_id: int, db: DBSession = Depends(get_db)):
    s = get_session(db, session_id)
    if not s:
        raise HTTPException(status_code=404, detail="会话不存在")
    return s


@router.get("/sessions/{session_id}/messages", response_model=list[MessageResponse])
def list_messages(session_id: int, db: DBSession = Depends(get_db)):
    s = get_session(db, session_id)
    if not s:
        raise HTTPException(status_code=404, detail="会话不存在")
    return get_messages(db, session_id)


@router.delete("/sessions/{session_id}")
def remove_session(session_id: int, db: DBSession = Depends(get_db)):
    if not delete_session(db, session_id):
        raise HTTPException(status_code=404, detail="会话不存在")
    return {"ok": True}


@router.patch("/sessions/{session_id}", response_model=SessionResponse)
def patch_session(session_id: int, body: SessionUpdate, db: DBSession = Depends(get_db)):
    s = update_session(db, session_id, body.title)
    if not s:
        raise HTTPException(status_code=404, detail="会话不存在")
    return s
