import httpx
from config import settings

class ElevenLabsService:
    BASE_URL = "https://api.elevenlabs.io/v1"
    
    async def synthesize_speech(self, text: str) -> bytes:
        url = f"{self.BASE_URL}/text-to-speech/{settings.elevenlabs_voice_id}"
        
        headers = {
            "xi-api-key": settings.elevenlabs_api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.3,
                "use_speaker_boost": True
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                return response.content
            else:
                raise Exception(f"ElevenLabs TTS failed with status {response.status_code}")

elevenlabs_service = ElevenLabsService()
