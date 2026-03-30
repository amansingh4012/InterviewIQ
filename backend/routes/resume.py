from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from auth import verify_clerk_token
from services.rag_service import rag_service
from database import resumes_collection
from datetime import datetime, timezone
import uuid

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(verify_clerk_token)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    
    # Check Content-Length header / file.size before reading into memory
    if file.size is not None and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")
    
    # Read file in a size-limited way to prevent OOM
    chunks = []
    total_read = 0
    while True:
        chunk = await file.read(8192)  # Read 8KB at a time
        if not chunk:
            break
        total_read += len(chunk)
        if total_read > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large. Max 5MB.")
        chunks.append(chunk)
    
    pdf_bytes = b"".join(chunks)
    
    resume_text = rag_service.extract_text_from_pdf(pdf_bytes)
    
    if not resume_text or len(resume_text) < 100:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    parsed_resume = await rag_service.parse_resume(resume_text)
    
    resume_doc = {
        "resume_id": str(uuid.uuid4()),
        "user_id": user_id,
        "raw_text": resume_text,
        "parsed_data": parsed_resume,
        "created_at": datetime.now(timezone.utc)
    }
    
    await resumes_collection.replace_one(
        {"user_id": user_id},
        resume_doc,
        upsert=True
    )
    
    return {
        "success": True,
        "resume_id": resume_doc["resume_id"],
        "parsed_data": parsed_resume,
        "candidate_name": parsed_resume.get("candidate_name", "")
    }

