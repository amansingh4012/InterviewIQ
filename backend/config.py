from pydantic_settings import BaseSettings
from pydantic import field_validator
from dotenv import load_dotenv
import logging

load_dotenv(override=True)

logger = logging.getLogger(__name__)


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
    
    # Environment flag
    environment: str = "development"
    
    @property
    def is_development(self) -> bool:
        return self.environment.lower() in ("development", "dev", "local")
    
    @property
    def is_production(self) -> bool:
        return self.environment.lower() in ("production", "prod")
    
    @field_validator("clerk_jwt_public_key")
    @classmethod
    def validate_public_key(cls, v: str) -> str:
        """Ensure the public key is not empty and has expected format."""
        v = v.strip()
        if not v:
            raise ValueError("clerk_jwt_public_key cannot be empty")
        if len(v) < 100:
            raise ValueError("clerk_jwt_public_key appears too short - check configuration")
        return v
    
    @field_validator("groq_api_key", "elevenlabs_api_key")
    @classmethod
    def validate_api_keys(cls, v: str) -> str:
        """Ensure API keys are not empty or placeholder values."""
        v = v.strip()
        if not v:
            raise ValueError("API key cannot be empty")
        placeholder_values = ["your_api_key", "xxx", "placeholder", "changeme", "test"]
        if v.lower() in placeholder_values:
            raise ValueError("API key appears to be a placeholder value")
        return v
    
    @field_validator("mongodb_url")
    @classmethod
    def validate_mongodb_url(cls, v: str) -> str:
        """Ensure MongoDB URL is valid."""
        v = v.strip()
        if not v:
            raise ValueError("mongodb_url cannot be empty")
        if not v.startswith(("mongodb://", "mongodb+srv://")):
            raise ValueError("mongodb_url must start with mongodb:// or mongodb+srv://")
        return v
    
    def validate_config(self) -> None:
        """Runtime validation for production requirements."""
        if self.is_production:
            errors = []
            warnings_list = []
            
            if not self.frontend_url.startswith("https://"):
                errors.append("frontend_url must use HTTPS in production")
            
            for warning in warnings_list:
                logger.warning(f"SECURITY WARNING: {warning}")
            
            if errors:
                raise ValueError(f"Production configuration errors: {'; '.join(errors)}")
            
            logger.info("Production configuration validated successfully")
        else:
            logger.info(f"Running in {self.environment} mode - some security checks relaxed")
    
    class Config:
        env_file = ".env"


settings = Settings()
