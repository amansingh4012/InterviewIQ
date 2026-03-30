from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str
    mongodb_url: str
    mongodb_db_name: str = "interviewiq"
    clerk_secret_key: str
    clerk_jwt_public_key: str
    elevenlabs_api_key: str
    elevenlabs_voice_id: str
    sarvam_api_key: str = ""
    frontend_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"

settings = Settings()
