from typing import Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    session_id: Optional[int] = None
    message: str
    thinking_mode: bool = False
