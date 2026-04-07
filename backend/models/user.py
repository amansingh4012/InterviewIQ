from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SubscriptionTier(str, Enum):
    FREE = "free"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(BaseModel):
    user_id: str
    tier: SubscriptionTier
    can_start_interview: bool
    interviews_remaining: Optional[int] = None
    reason: Optional[str] = None
    upgrade_prompt: Optional[str] = None


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
