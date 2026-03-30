from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class ScoreBreakdown(BaseModel):
    technical_accuracy: float = 0
    depth: float = 0
    personal_experience: float = 0
    communication: float = 0
    confidence: float = 0


class Evaluation(BaseModel):
    scores: ScoreBreakdown = Field(default_factory=ScoreBreakdown)
    overall_score: float = 0
    answer_quality: str = "acceptable"  # strong | acceptable | weak | very_weak
    what_they_got_right: str = ""
    what_they_missed: str = ""
    red_flags: List[str] = []
    topic_covered: str = ""
    should_follow_up: bool = False
    follow_up_reason: str = ""


class CategoryScores(BaseModel):
    technical_knowledge: float = 0
    project_depth: float = 0
    system_design: float = 0
    problem_solving: float = 0
    communication: float = 0
    dsa_fundamentals: float = 0


class Strength(BaseModel):
    area: str
    evidence: str
    score: float


class Weakness(BaseModel):
    area: str
    specific_gap: str
    what_was_said: str
    what_should_have_been_said: str
    score: float


class QuestionFeedback(BaseModel):
    question: str
    answer_summary: str
    score: float
    feedback: str


class StudyRecommendation(BaseModel):
    topic: str
    why: str
    resource: str
    priority: str  # high | medium | low


class Report(BaseModel):
    overall_score: float = 0
    overall_grade: str = "C"
    hire_recommendation: str = "Maybe"
    category_scores: CategoryScores = Field(default_factory=CategoryScores)
    strengths: List[Strength] = []
    weaknesses: List[Weakness] = []
    question_by_question: List[QuestionFeedback] = []
    study_recommendations: List[StudyRecommendation] = []
    biggest_win: str = ""
    most_critical_gap: str = ""
    one_thing_to_fix_immediately: str = ""
