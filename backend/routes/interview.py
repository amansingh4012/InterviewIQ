from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter
from slowapi.util import get_remote_address
from auth import verify_clerk_token
from services.llm_service import llm_service
from services.rag_service import rag_service
from services.analytics_service import analytics_service
from services.session_service import session_service
from services.subscription_service import subscription_service
from database import sessions_collection, resumes_collection
from datetime import datetime
import uuid
import json
import asyncio
import logging
import re

logger = logging.getLogger(__name__)
security_logger = logging.getLogger("security")

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# UUID validation pattern
UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.I)


def validate_uuid(value: str, field_name: str) -> str:
    """Validate UUID format to prevent injection attacks."""
    if not UUID_PATTERN.match(value):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name} format")
    return value


class StartInterviewRequest(BaseModel):
    resume_id: str = Field(..., min_length=36, max_length=36)
    role: str = Field(..., min_length=1, max_length=100)
    interview_type: str = Field(default="Mixed", max_length=50)
    difficulty: str = Field(default="Junior", max_length=20)
    
    @field_validator("resume_id")
    @classmethod
    def validate_resume_id(cls, v: str) -> str:
        if not UUID_PATTERN.match(v):
            raise ValueError("Invalid resume_id format")
        return v
    
    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        allowed = ["Junior", "Mid-Level", "Senior", "Staff", "Principal"]
        if v not in allowed:
            raise ValueError(f"difficulty must be one of: {', '.join(allowed)}")
        return v
    
    @field_validator("interview_type")
    @classmethod
    def validate_interview_type(cls, v: str) -> str:
        allowed = ["Technical", "Behavioral", "Mixed", "System Design"]
        if v not in allowed:
            raise ValueError(f"interview_type must be one of: {', '.join(allowed)}")
        return v


class SubmitAnswerRequest(BaseModel):
    session_id: str = Field(..., min_length=36, max_length=36)
    answer: str = Field(..., min_length=1, max_length=10000)  # Limit answer size
    request_nudge: bool = False
    
    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, v: str) -> str:
        if not UUID_PATTERN.match(v):
            raise ValueError("Invalid session_id format")
        return v


class EndInterviewRequest(BaseModel):
    session_id: str = Field(..., min_length=36, max_length=36)
    
    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, v: str) -> str:
        if not UUID_PATTERN.match(v):
            raise ValueError("Invalid session_id format")
        return v


@router.post("/start")
@limiter.limit("10/minute")  # Limit interview starts
async def start_interview(
    request: Request,  # Required for rate limiter
    interview_request: StartInterviewRequest,
    user_id: str = Depends(verify_clerk_token),
):
    # Check subscription status before allowing interview
    try:
        sub_status = await subscription_service.check_can_start_interview(user_id)
        if not sub_status.can_start_interview:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "subscription_limit_reached",
                    "message": sub_status.reason or "Interview limit reached",
                    "upgrade_prompt": sub_status.upgrade_prompt,
                    "tier": sub_status.tier.value if hasattr(sub_status.tier, 'value') else sub_status.tier,
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Subscription check failed, allowing interview: {e}")
        # Allow interview if subscription service fails (fail open for UX)
    
    # IDOR Prevention: Always verify user owns the resume
    resume_doc = await resumes_collection.find_one({
        "resume_id": interview_request.resume_id,
        "user_id": user_id  # Critical: ownership check
    })
    
    if not resume_doc:
        # Fallback: find any resume for this user (don't reveal if resume_id exists for other users)
        resume_doc = await resumes_collection.find_one({"user_id": user_id})
        
    if not resume_doc:
        raise HTTPException(status_code=404, detail="Resume not found. Please upload your resume first.")

    parsed_resume = resume_doc["parsed_data"]
    raw_resume_text = resume_doc.get("raw_text", "")

    # Generate interview strategy via Gemini
    try:
        strategy_data = await llm_service.initialize_session(
            parsed_resume=parsed_resume,
            role=interview_request.role,
            interview_type=interview_request.interview_type,
            difficulty=interview_request.difficulty,
        )
    except Exception as e:
        logger.error(f"Failed to generate interview strategy: {type(e).__name__}: {e}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")

    # Generate first question
    try:
        first_question = await llm_service.generate_first_question(
            parsed_resume=parsed_resume,
            role=interview_request.role,
            strategy=strategy_data,
        )
    except Exception as e:
        logger.error(f"Failed to generate first question: {type(e).__name__}: {e}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")

    # Create session using session_service (stores raw_resume_text!)
    session_doc = await session_service.create_session(
        user_id=user_id,
        resume_id=interview_request.resume_id,
        parsed_resume=parsed_resume,
        raw_resume_text=raw_resume_text,
        role=interview_request.role,
        interview_type=interview_request.interview_type,
        difficulty=interview_request.difficulty,
        strategy=strategy_data,
        first_question=first_question,
    )

    return {
        "session_id": session_doc["session_id"],
        "question": first_question,
        "question_number": 1,
        "status": "active",
    }


@router.post("/answer")
@limiter.limit("20/minute")  # Limit answer submissions
async def submit_answer(
    request: Request,  # Required for rate limiter
    answer_request: SubmitAnswerRequest,
    user_id: str = Depends(verify_clerk_token),
):
    session = await session_service.get_session(answer_request.session_id, user_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Interview already completed")

    # Handle nudge/hint request
    if answer_request.request_nudge:
        try:
            nudge = await llm_service.generate_nudge(
                current_question=session["current_question"],
                relevant_background=str(session["parsed_resume"].get("projects", [])),
            )
            return {"nudge": nudge, "type": "nudge"}
        except Exception as e:
            return {"nudge": "Think about the core concepts involved and what tradeoffs you'd consider.", "type": "nudge"}

    # Detect empty or minimal answers
    answer_text = answer_request.answer.strip().lower()
    is_empty_answer = (
        len(answer_text) < 10 or
        answer_text in ["i don't know", "i dont know", "pass", "skip", "next", "no idea", "not sure", "idk"] or
        answer_text.startswith("i don't know") or
        answer_text.startswith("i dont know")
    )

    # Build vector store from raw resume text (fixed: use raw_resume_text field)
    resume_text = session.get("raw_resume_text", "")
    if not resume_text:
        resume_text = json.dumps(session.get("parsed_resume", {}))

    try:
        vector_store = rag_service.create_vector_store(resume_text)
        relevant_context = rag_service.get_relevant_context(
            vector_store, session["current_question"]
        )
    except Exception:
        relevant_context = json.dumps(session.get("parsed_resume", {}))

    # Handle empty/minimal answers with a predefined evaluation
    if is_empty_answer:
        evaluation = {
            "scores": {"technical_accuracy": 0, "depth": 0, "personal_experience": 0, "communication": 2, "confidence": 1},
            "overall_score": 1,
            "answer_quality": "skipped",
            "what_they_got_right": "",
            "what_they_missed": "Candidate did not attempt to answer this question",
            "red_flags": ["No answer provided"],
            "topic_covered": session.get("strategy", {}).get("strategy", {}).get("topics_to_cover", ["general"])[0] if session.get("strategy", {}).get("strategy", {}).get("topics_to_cover") else "general",
            "should_follow_up": False,
            "follow_up_reason": "Moving to different topic since candidate skipped",
        }
    else:
        # Evaluate the answer normally
        try:
            evaluation = await llm_service.evaluate_answer(
                question=session["current_question"],
                answer=answer_request.answer,
                relevant_background=relevant_context,
                role=session["role"],
                difficulty=session["difficulty"],
            )
        except Exception as e:
            # Graceful fallback evaluation
            evaluation = {
                "scores": {"technical_accuracy": 5, "depth": 5, "personal_experience": 5, "communication": 5, "confidence": 5},
                "overall_score": 5,
                "answer_quality": "acceptable",
                "what_they_got_right": "Answer received",
                "what_they_missed": "",
                "red_flags": [],
                "topic_covered": "general",
                "should_follow_up": False,
                "follow_up_reason": "",
            }

    conversation_entry = {
        "question": session["current_question"],
        "answer": answer_request.answer,
        "quality": evaluation.get("answer_quality"),
        "score": evaluation.get("overall_score"),
        "question_number": session["questions_asked"],
    }

    updated_conversation = session["conversation"] + [conversation_entry]
    updated_evaluations = session["evaluations"] + [evaluation]
    updated_topics = list(session["topics_covered"])

    topic = evaluation.get("topic_covered", "")
    if topic and topic not in updated_topics:
        updated_topics.append(topic)

    strategy_topics = session.get("strategy", {}).get("strategy", {}).get("topics_to_cover", [])
    topics_remaining = [t for t in strategy_topics if t not in updated_topics]

    # Check if interview should complete
    is_complete = session["questions_asked"] >= 10

    if not is_complete:
        # Generate next question
        try:
            next_question_text = await llm_service.generate_next_question(
                parsed_resume=session["parsed_resume"],
                role=session["role"],
                strategy=session["strategy"],
                conversation_history=updated_conversation,
                last_evaluation=evaluation,
                questions_asked=session["questions_asked"],
                topics_covered=updated_topics,
                topics_remaining=topics_remaining,
            )
            if next_question_text.strip() == "INTERVIEW_COMPLETE":
                is_complete = True
        except Exception as e:
            next_question_text = "INTERVIEW_COMPLETE"
            is_complete = True

    if is_complete:
        # Generate report with retry logic
        report = None
        last_error = None
        for attempt in range(3):
            try:
                report = await llm_service.generate_report(
                    candidate_name=session["parsed_resume"].get("candidate_name", "Candidate"),
                    role=session["role"],
                    difficulty=session["difficulty"],
                    transcript=updated_conversation,
                    all_evaluations=updated_evaluations,
                )
                break  # Success
            except Exception as e:
                last_error = e
                logger.error(f"Report generation attempt {attempt + 1}/3 failed: {type(e).__name__}: {e}")
                if attempt < 2:
                    wait_time = 5 * (attempt + 1)  # Backoff: 5s, 10s
                    logger.info(f"Waiting {wait_time}s before retry (Groq rate limit)...")
                    await asyncio.sleep(wait_time)

        if report is None:
            logger.error(f"All 3 report generation attempts failed. Last error: {last_error}")
            report = {
                "overall_score": 0,
                "overall_grade": "?",
                "hire_recommendation": "Error generating report",
                "_generation_failed": True,
                "_error": str(last_error),
                "category_scores": {},
                "strengths": [],
                "weaknesses": [],
                "question_by_question": [],
                "study_recommendations": [],
                "biggest_win": "",
                "most_critical_gap": "",
                "one_thing_to_fix_immediately": "",
            }

        analytics = analytics_service.analyze_session_scores(updated_evaluations)

        await session_service.complete_session(
            session_id=answer_request.session_id,
            conversation=updated_conversation,
            evaluations=updated_evaluations,
            topics_covered=updated_topics,
            report=report,
            analytics=analytics,
        )
        
        # Increment interview count for subscription tracking
        try:
            await subscription_service.increment_interview_count(user_id)
        except Exception as e:
            logger.warning(f"Failed to increment interview count: {e}")

        return {
            "status": "complete",
            "message": "Interview completed",
            "session_id": answer_request.session_id,
            "overall_score": report.get("overall_score"),
            "redirect_to": f"/interview/report/{answer_request.session_id}",
        }

    # Continue interview
    await session_service.update_session_after_answer(
        session_id=answer_request.session_id,
        conversation=updated_conversation,
        evaluations=updated_evaluations,
        topics_covered=updated_topics,
        next_question=next_question_text,
        questions_asked=session["questions_asked"] + 1,
    )

    return {
        "status": "active",
        "question": next_question_text,
        "question_number": session["questions_asked"] + 1,
        "evaluation_preview": {
            "score": evaluation.get("overall_score"),
            "quality": evaluation.get("answer_quality"),
        },
    }


@router.get("/session/{session_id}")
async def get_active_session(
    session_id: str,
    user_id: str = Depends(verify_clerk_token),
):
    """
    Retrieve the current state of an active (or completed) interview session.
    Used by the frontend to recover state after a page refresh.
    """
    session = await session_service.get_session(session_id, user_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Build conversation history summary for the frontend
    conversation_summary = [
        {
            "question": entry.get("question", ""),
            "answer": entry.get("answer", ""),
            "score": entry.get("score"),
            "quality": entry.get("quality"),
        }
        for entry in session.get("conversation", [])
    ]

    response = {
        "session_id": session["session_id"],
        "status": session["status"],
        "current_question": session.get("current_question", ""),
        "question_number": session.get("questions_asked", 1),
        "conversation": conversation_summary,
        "role": session.get("role", ""),
        "difficulty": session.get("difficulty", ""),
        "interview_type": session.get("interview_type", ""),
    }

    # If completed, include redirect info
    if session["status"] == "completed":
        response["redirect_to"] = f"/interview/report/{session_id}"
        response["overall_score"] = session.get("report", {}).get("overall_score")

    return response


@router.get("/report/{session_id}")
async def get_report(
    session_id: str,
    user_id: str = Depends(verify_clerk_token),
):
    session = await session_service.get_session(session_id, user_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session["status"] != "completed":
        raise HTTPException(status_code=400, detail="Report not ready yet")

    report = session.get("report", {})

    # Lazy regeneration: if the stored report is the error fallback, retry now
    if report.get("_generation_failed"):
        logger.info(f"Retrying report generation for session {session_id}")
        try:
            report = await llm_service.generate_report(
                candidate_name=session["parsed_resume"].get("candidate_name", "Candidate"),
                role=session["role"],
                difficulty=session["difficulty"],
                transcript=session.get("conversation", []),
                all_evaluations=session.get("evaluations", []),
            )
            # Persist the successfully regenerated report
            await sessions_collection.update_one(
                {"session_id": session_id},
                {"$set": {"report": report}}
            )
            logger.info(f"Report regeneration succeeded for session {session_id}")
        except Exception as e:
            logger.error(f"Report regeneration still failed for {session_id}: {e}")
            # Return the existing fallback — user can try again later

    # Check subscription tier to determine what report data to return
    is_premium = False
    try:
        sub_status = await subscription_service.get_subscription_status(user_id)
        tier = sub_status.get("tier", "free") if isinstance(sub_status, dict) else getattr(sub_status, "tier", "free")
        tier_value = tier.value if hasattr(tier, 'value') else str(tier)
        is_premium = tier_value in ("premium", "enterprise")
    except Exception as e:
        logger.warning(f"Failed to check subscription for report access: {e}")
        is_premium = False  # Default to restricted if check fails
    
    # Build response based on tier
    response = {
        "session_id": session_id,
        "role": session["role"],
        "difficulty": session["difficulty"],
        "completed_at": session.get("completed_at"),
        "is_premium_report": is_premium,
    }
    
    if is_premium:
        # Full report for premium/enterprise users
        response["report"] = report
        response["analytics"] = session.get("analytics", {})
    else:
        # Limited report for free tier users
        response["report"] = {
            "overall_score": report.get("overall_score"),
            "overall_grade": report.get("overall_grade"),
            "hire_recommendation": report.get("hire_recommendation"),
            # Truncated feedback
            "strengths": report.get("strengths", [])[:2],  # Only first 2 strengths
            "weaknesses": report.get("weaknesses", [])[:1],  # Only first weakness
            # Premium-only fields shown as locked
            "category_scores": "🔒 Upgrade to Premium for detailed category breakdown",
            "question_by_question": "🔒 Upgrade to Premium for question-by-question analysis",
            "study_recommendations": "🔒 Upgrade to Premium for personalized study plan",
            "biggest_win": report.get("biggest_win", ""),
            "most_critical_gap": "🔒 Upgrade to Premium",
            "one_thing_to_fix_immediately": "🔒 Upgrade to Premium for actionable advice",
        }
        response["analytics"] = {
            "summary": "🔒 Upgrade to Premium for detailed analytics",
        }
        response["upgrade_prompt"] = {
            "message": "Unlock your full interview report with detailed feedback",
            "features": [
                "Question-by-question analysis",
                "Detailed category scores",
                "Personalized study recommendations",
                "Progress tracking over time"
            ],
            "cta": "Upgrade to Premium",
            "url": "/pricing"
        }
    
    return response


@router.get("/sessions")
async def get_user_sessions(user_id: str = Depends(verify_clerk_token)):
    sessions = await session_service.get_user_sessions(user_id)
    return {"sessions": sessions}
