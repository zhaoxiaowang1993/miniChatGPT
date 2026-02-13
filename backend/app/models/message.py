"""消息表模型"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # user | assistant | system
    content = Column(Text, default="")
    reasoning_content = Column(Text, default=None)  # 仅思考模式下 assistant 消息可能有
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="messages")
