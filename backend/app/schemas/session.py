from datetime import datetime
from pydantic import BaseModel


class SessionCreate(BaseModel):
    pass


class SessionUpdate(BaseModel):
    title: str


class SessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
