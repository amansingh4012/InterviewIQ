import asyncio
from services.elevenlabs_service import elevenlabs_service

async def test():
    try:
        await elevenlabs_service.synthesize_speech("Hello world")
        print("SUCCESS")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test())
