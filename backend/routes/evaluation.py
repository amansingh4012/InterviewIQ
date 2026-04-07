from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from auth import verify_clerk_token
from services.llm_service import llm_service
from services.rag_service import rag_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class EvaluateRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    answer: str = Field(..., min_length=1, max_length=10000)
    resume_text: str = Field(..., min_length=1, max_length=50000)
    role: str = Field(..., min_length=1, max_length=100)
    difficulty: str = Field(..., min_length=1, max_length=20)


@router.post("/answer")
async def evaluate_answer(
    request: EvaluateRequest,
    user_id: str = Depends(verify_clerk_token),
):
    """Internal endpoint: evaluate a single answer against a question."""
    try:
        vector_store = rag_service.create_vector_store(request.resume_text)
        relevant_context = rag_service.get_relevant_context(
            vector_store, request.question
        )

        evaluation = await llm_service.evaluate_answer(
            question=request.question,
            answer=request.answer,
            relevant_background=relevant_context,
            role=request.role,
            difficulty=request.difficulty,
        )
        return {"success": True, "evaluation": evaluation}
    except Exception as e:
        logger.error(f"Evaluation failed: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=503, detail="Evaluation service temporarily unavailable. Please try again."
        )
