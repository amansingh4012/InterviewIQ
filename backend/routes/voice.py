from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator
from auth import verify_clerk_token
from services.elevenlabs_service import elevenlabs_service
from services.sarvam_service import sarvam_service
import logging
import re

router = APIRouter()
logger = logging.getLogger(__name__)

# Disallow potentially dangerous patterns in text
DANGEROUS_PATTERNS = re.compile(r'[<>{}\\]|javascript:|data:|vbscript:', re.I)


class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    
    @field_validator("text")
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        """Sanitize text to prevent injection and ensure safe TTS input."""
        v = v.strip()
        if not v:
            raise ValueError("Text cannot be empty")
        if DANGEROUS_PATTERNS.search(v):
            raise ValueError("Text contains invalid characters")
        # Remove control characters except newlines and tabs
        v = ''.join(char for char in v if char.isprintable() or char in '\n\t')
        return v


@router.post("/synthesize")
async def synthesize_speech(
    request: Request,  # Required for rate limiter
    synth_request: SynthesizeRequest,
    user_id: str = Depends(verify_clerk_token)
):
    try:
        audio_bytes = await elevenlabs_service.synthesize_speech(synth_request.text)
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=question.mp3"}
        )
    except Exception as e:
        logger.warning(f"ElevenLabs synthesis failed, attempting Sarvam AI fallback: {type(e).__name__}")
        try:
            # Fallback to Sarvam AI
            audio_bytes = await sarvam_service.synthesize_speech(synth_request.text)
            return Response(
                content=audio_bytes,
                media_type="audio/wav",
                headers={"Content-Disposition": "inline; filename=question.wav"}
            )
        except Exception as fallback_error:
            # Log full error details server-side
            logger.error(f"Both TTS services failed. Primary: {type(e).__name__}, Fallback: {type(fallback_error).__name__}")
            # Return generic error to client
            raise HTTPException(
                status_code=503, 
                detail="Voice synthesis service temporarily unavailable. Please try again or use text mode."
            )
