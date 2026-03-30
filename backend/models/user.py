from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class UserProfile(BaseModel):
    user_id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total_sessions: int = 0
    latest_resume_id: Optional[str] = None


class ResumeDocument(BaseModel):
    resume_id: str
    user_id: str
    raw_text: str
    parsed_data: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
