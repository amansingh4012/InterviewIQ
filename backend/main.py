import warnings
warnings.filterwarnings("ignore", message=".*Pydantic V1.*", category=UserWarning)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import create_indexes
from routes import resume, interview, voice, analytics, evaluation
from config import settings
import logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_indexes()
    yield


app = FastAPI(title="InterviewIQ API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(interview.router, prefix="/interview", tags=["Interview"])
app.include_router(evaluation.router, prefix="/evaluate", tags=["Evaluation"])
app.include_router(voice.router, prefix="/voice", tags=["Voice"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "InterviewIQ API"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Global exception caught: {exc}")
    # By catching this manually, we keep it in the ASGI stack 
    # and the CORS middleware correctly attaches headers.
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error: " + str(exc)}
    )
