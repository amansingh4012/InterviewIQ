from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from auth import verify_clerk_token
from services.llm_service import llm_service
from services.rag_service import rag_service

router = APIRouter()


class EvaluateRequest(BaseModel):
    question: str
    answer: str
    resume_text: str
    role: str
    difficulty: str


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
        raise HTTPException(
            status_code=500, detail=f"Evaluation failed: {str(e)}"
        )
