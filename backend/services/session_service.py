from database import sessions_collection, resumes_collection
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import uuid


class SessionService:
    """Manages interview session state in MongoDB."""

    async def create_session(
        self,
        user_id: str,
        resume_id: str,
        parsed_resume: dict,
        raw_resume_text: str,
        role: str,
        interview_type: str,
        difficulty: str,
        strategy: dict,
        first_question: str,
    ) -> dict:
        session_id = str(uuid.uuid4())
        session_doc = {
            "session_id": session_id,
            "user_id": user_id,
            "resume_id": resume_id,
            "parsed_resume": parsed_resume,
            "raw_resume_text": raw_resume_text,
            "role": role,
            "interview_type": interview_type,
            "difficulty": difficulty,
            "strategy": strategy,
            "conversation": [],
            "evaluations": [],
            "current_question": first_question,
            "questions_asked": 1,
            "topics_covered": [],
            "status": "active",
            "created_at": datetime.now(timezone.utc),
        }
        await sessions_collection.insert_one(session_doc)
        return session_doc

    async def get_session(self, session_id: str, user_id: str) -> Optional[dict]:
        return await sessions_collection.find_one(
            {"session_id": session_id, "user_id": user_id}
        )

    async def update_session_after_answer(
        self,
        session_id: str,
        conversation: list,
        evaluations: list,
        topics_covered: list,
        next_question: str,
        questions_asked: int,
    ) -> None:
        await sessions_collection.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "conversation": conversation,
                    "evaluations": evaluations,
                    "topics_covered": topics_covered,
                    "current_question": next_question,
                    "questions_asked": questions_asked,
                }
            },
        )

    async def complete_session(
        self,
        session_id: str,
        conversation: list,
        evaluations: list,
        topics_covered: list,
        report: dict,
        analytics: dict,
    ) -> None:
        await sessions_collection.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "conversation": conversation,
                    "evaluations": evaluations,
                    "topics_covered": topics_covered,
                    "status": "completed",
                    "report": report,
                    "analytics": analytics,
                    "completed_at": datetime.now(timezone.utc),
                }
            },
        )

    async def get_user_sessions(self, user_id: str, limit: int = 20) -> list:
        cursor = (
            sessions_collection.find(
                {"user_id": user_id, "status": "completed"},
                {
                    "conversation": 0,
                    "evaluations": 0,
                    "strategy": 0,
                    "parsed_resume": 0,
                    "raw_resume_text": 0,
                },
            )
            .sort("created_at", -1)
            .limit(limit)
        )
        sessions = []
        async for session in cursor:
            session["_id"] = str(session["_id"])
            sessions.append(session)
        return sessions

    async def get_all_completed_sessions(self, user_id: str) -> list:
        cursor = sessions_collection.find(
            {"user_id": user_id, "status": "completed"}
        ).sort("created_at", 1)
        sessions = []
        async for session in cursor:
            sessions.append(session)
        return sessions


session_service = SessionService()
