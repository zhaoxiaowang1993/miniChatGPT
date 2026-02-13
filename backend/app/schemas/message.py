from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    reasoning_content: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
