import warnings
warnings.filterwarnings("ignore", message=".*Pydantic V1.*", category=UserWarning)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from database import create_indexes
from routes import resume, interview, voice, analytics, evaluation
from config import settings
import logging
import uuid

# Configure logging for security events
logging.basicConfig(level=logging.INFO)
security_logger = logging.getLogger("security")

# Rate limiter configuration
# Uses client IP for rate limiting key
# NOTE: In production with multiple workers, use Redis: storage_uri="redis://host:6379"
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],  # Stricter default limit
    storage_uri="memory://",  # Use Redis (e.g., "redis://localhost:6379") in production for distributed rate limiting
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate critical configuration on startup
    settings.validate_config()
    await create_indexes()
    yield


app = FastAPI(
    title="InterviewIQ API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.is_development else None,  # Disable docs in production
    redoc_url="/redoc" if settings.is_development else None,
)

# Add rate limiter to app state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(self), camera=()"
    
    # HSTS only in production with HTTPS
    if not settings.is_development:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response


# CORS configuration - hardened
allowed_origins = [settings.frontend_url]
if settings.is_development:
    allowed_origins.extend(["http://localhost:3000", "http://localhost:3001"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # Only needed methods
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],  # Explicit headers
    expose_headers=["X-Request-ID"],
    max_age=600,  # Cache preflight for 10 minutes
)

app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(interview.router, prefix="/interview", tags=["Interview"])
app.include_router(evaluation.router, prefix="/evaluate", tags=["Evaluation"])
app.include_router(voice.router, prefix="/voice", tags=["Voice"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "InterviewIQ API"}


@app.get("/api/health")
async def api_health():
    return {"status": "ok", "service": "InterviewIQ API"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Generate a unique error ID for tracking
    error_id = str(uuid.uuid4())[:8]
    
    # Log full error details server-side (never exposed to client)
    security_logger.error(
        f"Error ID: {error_id} | Path: {request.url.path} | "
        f"Method: {request.method} | Exception: {type(exc).__name__}: {exc}"
    )
    
    # Return generic error to client (prevents information leakage)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again later.",
            "error_id": error_id  # For support reference
        }
    )
