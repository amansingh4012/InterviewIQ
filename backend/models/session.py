from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class SessionCreate(BaseModel):
    resume_id: str
    role: str
    interview_type: str = "Mixed"
    difficulty: str = "Junior"


class SessionDocument(BaseModel):
    session_id: str
    user_id: str
    resume_id: str
    parsed_resume: Dict[str, Any]
    raw_resume_text: str = ""
    role: str
    interview_type: str
    difficulty: str
    strategy: Dict[str, Any] = {}
    conversation: List[Dict[str, Any]] = []
    evaluations: List[Dict[str, Any]] = []
    current_question: str = ""
    questions_asked: int = 0
    topics_covered: List[str] = []
    status: str = "active"  # active | generating_report | completed
    report: Optional[Dict[str, Any]] = None
    analytics: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class ConversationEntry(BaseModel):
    question: str
    answer: str
    quality: Optional[str] = None
    score: Optional[float] = None
    question_number: int = 0


class SessionResponse(BaseModel):
    session_id: str
    question: str
    question_number: int
    status: str


class AnswerRequest(BaseModel):
    session_id: str
    answer: str
    request_nudge: bool = False


class AnswerResponse(BaseModel):
    status: str
    question: Optional[str] = None
    question_number: Optional[int] = None
    evaluation_preview: Optional[Dict[str, Any]] = None
    nudge: Optional[str] = None
    message: Optional[str] = None
    redirect_to: Optional[str] = None
    overall_score: Optional[float] = None
