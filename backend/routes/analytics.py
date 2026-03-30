from fastapi import APIRouter, HTTPException, Depends
from auth import verify_clerk_token
from database import sessions_collection
from services.analytics_service import analytics_service
from services.llm_service import llm_service
from prompts.progress_analyzer import PROGRESS_ANALYZER_PROMPT
import json

router = APIRouter()


@router.get("/progress")
async def get_progress(user_id: str = Depends(verify_clerk_token)):
    cursor = sessions_collection.find(
        {"user_id": user_id, "status": "completed"}
    ).sort("created_at", 1)

    all_sessions = []
    session_number = 1
    async for session in cursor:
        all_sessions.append({
            "session_number": session_number,
            "role": session.get("role"),
            "difficulty": session.get("difficulty"),
            "evaluations": session.get("evaluations", []),
            "created_at": str(session.get("created_at")),
            "overall_score": session.get("report", {}).get("overall_score", 0)
        })
        session_number += 1

    if len(all_sessions) < 2:
        return {
            "message": "Complete at least 2 interviews to see progress analytics",
            "sessions_completed": len(all_sessions)
        }

    multi_analytics = analytics_service.analyze_multi_session_progress(all_sessions)

    # Generate AI-powered coaching insights using Gemini
    ai_insights = None
    try:
        # Build a concise summary for the prompt
        sessions_summary = "\n".join([
            f"Session {s['session_number']}: Role={s['role']}, "
            f"Difficulty={s['difficulty']}, Score={s.get('overall_score') or 0:.1f}, "
            f"Date={s['created_at']}"
            for s in all_sessions
        ])

        # Determine candidate name and dominant role from sessions
        candidate_name = "Candidate"
        role_counts: dict[str, int] = {}
        for s in all_sessions:
            r = s.get("role", "Developer")
            role_counts[r] = role_counts.get(r, 0) + 1
        dominant_role = max(role_counts, key=role_counts.get) if role_counts else "Developer"

        ai_insights = await llm_service.generate_progress_analysis(
            candidate_name=candidate_name,
            role=dominant_role,
            session_count=len(all_sessions),
            sessions_summary=sessions_summary,
            analytics_data=json.dumps(multi_analytics, indent=2),
            prompt_template=PROGRESS_ANALYZER_PROMPT,
        )
    except Exception as e:
        # Graceful fallback — AI insights are optional
        ai_insights = {
            "overall_trajectory": multi_analytics.get("trajectory", "insufficient_data"),
            "improvement_rate": "steady",
            "consistent_strengths": [],
            "persistent_weaknesses": multi_analytics.get("persistent_weak_areas", []),
            "resolved_weaknesses": [],
            "readiness_assessment": {
                "ready_for_interviews": False,
                "estimated_weeks_to_ready": 0,
                "confidence_level": "low"
            },
            "this_week_focus": "Keep practicing consistently",
            "motivational_note": "Every session makes you stronger. Keep going!"
        }

    return {
        "sessions_completed": len(all_sessions),
        "analytics": multi_analytics,
        "ai_insights": ai_insights,
    }
