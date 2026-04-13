from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from auth import verify_clerk_token
from services.rag_service import rag_service
from database import resumes_collection
from datetime import datetime, timezone
import uuid
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
PDF_MAGIC_BYTES = b'%PDF'
ALLOWED_MIME_TYPES = {'application/pdf'}


def validate_pdf_content(pdf_bytes: bytes) -> bool:
    """
    Validate PDF content by checking magic bytes and basic structure.
    This prevents malicious files disguised as PDFs.
    """
    if len(pdf_bytes) < 8:
        return False
    
    # Check magic bytes (PDF files start with %PDF)
    if not pdf_bytes[:4] == PDF_MAGIC_BYTES:
        return False
    
    # Check for PDF EOF marker (%%EOF should appear near the end)
    # This catches truncated/corrupted files and some malicious payloads
    tail = pdf_bytes[-1024:] if len(pdf_bytes) > 1024 else pdf_bytes
    if b'%%EOF' not in tail:
        # Some valid PDFs might not have %%EOF right at the end, so just warn
        logger.warning("PDF file missing %%EOF marker - proceeding with caution")
    
    return True


@router.post("/upload")
async def upload_resume(
    request: Request,  # Required for rate limiter
    file: UploadFile = File(...),
    user_id: str = Depends(verify_clerk_token)
):
    # Check filename extension (first layer of validation)
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    
    # Check Content-Type header if provided
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        logger.warning(f"Rejected file with content_type: {file.content_type}")
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
    
    # Validate PDF magic bytes and structure (defense against file type spoofing)
    if not validate_pdf_content(pdf_bytes):
        logger.warning(f"Rejected file failing PDF validation from user {user_id[:20]}...")
        raise HTTPException(status_code=400, detail="Invalid PDF file. Please upload a valid PDF document.")
    
    # Extract text from PDF
    try:
        resume_text = rag_service.extract_text_from_pdf(pdf_bytes)
    except Exception as e:
        logger.error(f"PDF text extraction failed: {type(e).__name__}")
        raise HTTPException(status_code=400, detail="Could not process PDF. Please ensure it contains readable text.")
    
    if not resume_text or len(resume_text) < 100:
        raise HTTPException(status_code=400, detail="Could not extract sufficient text from PDF. Please ensure your resume contains readable text.")
    
    # Limit resume text size to prevent abuse
    if len(resume_text) > 100000:
        resume_text = resume_text[:100000]
        logger.warning(f"Truncated oversized resume text for user {user_id[:20]}...")
    
    # Parse resume with retry logic for Groq rate limits
    parsed_resume = None
    last_error = None
    for attempt in range(3):
        try:
            parsed_resume = await rag_service.parse_resume(resume_text)
            break
        except Exception as e:
            last_error = e
            logger.error(f"Resume parsing attempt {attempt + 1}/3 failed: {type(e).__name__}")
            if attempt < 2:
                wait_time = 5 * (attempt + 1)
                logger.info(f"Waiting {wait_time}s before retry...")
                await asyncio.sleep(wait_time)

    if parsed_resume is None:
        raise HTTPException(
            status_code=503,
            detail="AI service temporarily unavailable. Please try again in a few seconds."
        )
    
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

