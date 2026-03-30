from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from auth import verify_clerk_token
from services.elevenlabs_service import elevenlabs_service
from services.sarvam_service import sarvam_service
import logging

router = APIRouter()

class SynthesizeRequest(BaseModel):
    text: str

@router.post("/synthesize")
async def synthesize_speech(
    request: SynthesizeRequest,
    user_id: str = Depends(verify_clerk_token)
):
    if len(request.text) > 1000:
        raise HTTPException(status_code=400, detail="Text too long. Max 1000 characters.")
    
    try:
        audio_bytes = await elevenlabs_service.synthesize_speech(request.text)
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=question.mp3"}
        )
    except Exception as e:
        logging.warning(f"ElevenLabs synthesis failed, attempting Sarvam AI fallback: {str(e)}")
        try:
            # Fallback to Sarvam AI
            audio_bytes = await sarvam_service.synthesize_speech(request.text)
            return Response(
                content=audio_bytes,
                media_type="audio/wav",
                headers={"Content-Disposition": "inline; filename=question.wav"}
            )
        except Exception as fallback_error:
            # If both fail, let the frontend know (so it can use the browser's TTS fallback)
            raise HTTPException(
                status_code=500, 
                detail=f"Voice synthesis failed (Primary and Fallback failed). Primary error: {str(e)}. Fallback error: {str(fallback_error)}"
            )
