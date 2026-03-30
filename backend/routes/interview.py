from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from auth import verify_clerk_token
from services.llm_service import llm_service
from services.rag_service import rag_service
from services.analytics_service import analytics_service
from services.session_service import session_service
from database import sessions_collection, resumes_collection
from datetime import datetime
import uuid
import json

router = APIRouter()


class StartInterviewRequest(BaseModel):
    resume_id: str
    role: str
    interview_type: str = "Mixed"
    difficulty: str = "Junior"


class SubmitAnswerRequest(BaseModel):
    session_id: str
    answer: str
    request_nudge: bool = False


class EndInterviewRequest(BaseModel):
    session_id: str


@router.post("/start")
async def start_interview(
    request: StartInterviewRequest,
    user_id: str = Depends(verify_clerk_token),
):
    # Find the resume document
    resume_doc = await resumes_collection.find_one({"resume_id": request.resume_id})
    if not resume_doc:
        # Fallback: find by user_id
        resume_doc = await resumes_collection.find_one({"user_id": user_id})
    if not resume_doc:
        raise HTTPException(status_code=404, detail="Resume not found. Please upload your resume first.")

    parsed_resume = resume_doc["parsed_data"]
    raw_resume_text = resume_doc.get("raw_text", "")

    # Generate interview strategy via Gemini
    try:
        strategy_data = await llm_service.initialize_session(
            parsed_resume=parsed_resume,
            role=request.role,
            interview_type=request.interview_type,
            difficulty=request.difficulty,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate interview strategy: {str(e)}")

    # Generate first question
    try:
        first_question = await llm_service.generate_first_question(
            parsed_resume=parsed_resume,
            role=request.role,
            strategy=strategy_data,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate first question: {str(e)}")

    # Create session using session_service (stores raw_resume_text!)
    session_doc = await session_service.create_session(
        user_id=user_id,
        resume_id=request.resume_id,
        parsed_resume=parsed_resume,
        raw_resume_text=raw_resume_text,
        role=request.role,
        interview_type=request.interview_type,
        difficulty=request.difficulty,
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
async def submit_answer(
    request: SubmitAnswerRequest,
    user_id: str = Depends(verify_clerk_token),
):
    session = await session_service.get_session(request.session_id, user_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Interview already completed")

    # Handle nudge/hint request
    if request.request_nudge:
        try:
            nudge = await llm_service.generate_nudge(
                current_question=session["current_question"],
                relevant_background=str(session["parsed_resume"].get("projects", [])),
            )
            return {"nudge": nudge, "type": "nudge"}
        except Exception as e:
            return {"nudge": "Think about the core concepts involved and what tradeoffs you'd consider.", "type": "nudge"}

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

    # Evaluate the answer
    try:
        evaluation = await llm_service.evaluate_answer(
            question=session["current_question"],
            answer=request.answer,
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
        "answer": request.answer,
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
        # Generate report
        try:
            report = await llm_service.generate_report(
                candidate_name=session["parsed_resume"].get("candidate_name", "Candidate"),
                role=session["role"],
                difficulty=session["difficulty"],
                transcript=updated_conversation,
                all_evaluations=updated_evaluations,
            )
        except Exception as e:
            report = {
                "overall_score": 0,
                "overall_grade": "?",
                "hire_recommendation": "Error generating report",
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
            session_id=request.session_id,
            conversation=updated_conversation,
            evaluations=updated_evaluations,
            topics_covered=updated_topics,
            report=report,
            analytics=analytics,
        )

        return {
            "status": "complete",
            "message": "Interview completed",
            "session_id": request.session_id,
            "overall_score": report.get("overall_score"),
            "redirect_to": f"/interview/report/{request.session_id}",
        }

    # Continue interview
    await session_service.update_session_after_answer(
        session_id=request.session_id,
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

    return {
        "session_id": session_id,
        "role": session["role"],
        "difficulty": session["difficulty"],
        "report": session.get("report", {}),
        "analytics": session.get("analytics", {}),
        "completed_at": session.get("completed_at"),
    }


@router.get("/sessions")
async def get_user_sessions(user_id: str = Depends(verify_clerk_token)):
    sessions = await session_service.get_user_sessions(user_id)
    return {"sessions": sessions}
