import httpx
import base64
from config import settings

class SarvamService:
    BASE_URL = "https://api.sarvam.ai/text-to-speech"
    
    async def synthesize_speech(self, text: str) -> bytes:
        if not settings.sarvam_api_key:
            raise Exception("No SARVAM_API_KEY provided in environment variables")

        headers = {
            "api-subscription-key": settings.sarvam_api_key,
            "Content-Type": "application/json"
        }
        
        # Sarvam typically expects 'hi-IN' but can synthesize english.
        # Ensure we send appropriate speaker code and model based on Sarvam's docs.
        payload = {
            "inputs": [text],
            "target_language_code": "hi-IN",
            "speaker": "meera",
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.5,
            "speech_sample_rate": 24000, 
            "enable_preprocessing": True,
            "model": "aura-tts-ph-1"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.BASE_URL, json=payload, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if "audios" in data and len(data["audios"]) > 0:
                    # Sarvam returns a base64 encoded wav string
                    audio_b64 = data["audios"][0]
                    return base64.b64decode(audio_b64)
                else:
                    raise Exception("Sarvam AI returned 200 but no audio data found.")
            else:
                raise Exception(f"Sarvam AI error: {response.status_code} - {response.text}")

sarvam_service = SarvamService()
