"""会话与消息业务逻辑"""
from typing import List, Optional
from sqlalchemy.orm import Session as DBSession

from app.models import Session, Message


def get_sessions(db: DBSession) -> List[Session]:
    return db.query(Session).order_by(Session.updated_at.desc()).all()


def create_session(db: DBSession, title: str = "新对话") -> Session:
    s = Session(title=title)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def get_session(db: DBSession, session_id: int) -> Optional[Session]:
    return db.query(Session).filter(Session.id == session_id).first()


def delete_session(db: DBSession, session_id: int) -> bool:
    s = get_session(db, session_id)
    if not s:
        return False
    db.delete(s)
    db.commit()
    return True


def update_session(db: DBSession, session_id: int, title: str) -> Optional[Session]:
    s = get_session(db, session_id)
    if not s:
        return None
    s.title = title
    db.commit()
    db.refresh(s)
    return s


def get_messages(db: DBSession, session_id: int) -> List[Message]:
    return db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at.asc()).all()


def messages_to_api_format(messages: List[Message]) -> List[dict]:
    """仅 role + content，不包含 reasoning_content（用于多轮上下文）"""
    return [{"role": m.role, "content": m.content or ""} for m in messages]


def add_message(db: DBSession, session_id: int, role: str, content: str, reasoning_content: Optional[str] = None) -> Message:
    m = Message(session_id=session_id, role=role, content=content, reasoning_content=reasoning_content)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def update_session_title_from_message(db: DBSession, session_id: int, first_user_content: str) -> None:
    """用首条用户消息前 30 字作为会话标题"""
    title = (first_user_content[:30] + "…") if len(first_user_content) > 30 else first_user_content
    if not title.strip():
        title = "新对话"
    update_session(db, session_id, title)
