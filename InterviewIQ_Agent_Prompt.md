# InterviewIQ — Master AI Agent Prompt
# Give this entire prompt to Cursor / Claude / Windsurf / any AI coding agent

---

## MASTER PROMPT (Copy everything below this line)

---

You are a senior full-stack engineer with deep expertise in AI/LLM integration, RAG pipelines, and modern web development. Your job is to build a complete, production-ready AI Mock Interview platform called **InterviewIQ** from scratch.

Do not skip any step. Do not summarize code. Write every file completely. After each phase, confirm what was built and what comes next.

---

## WHAT YOU ARE BUILDING

InterviewIQ is a real AI-powered mock interview platform where:
- User logs in with Clerk auth
- User uploads their resume (PDF)
- AI reads and understands their resume using a RAG pipeline
- User selects role + difficulty level
- AI conducts a real dynamic voice interview — asking follow-up questions based on their answers, just like a human interviewer
- After 10 questions, a full performance report is generated with scores, weak areas, and study recommendations
- After 3+ sessions, a progress analytics dashboard shows improvement trends using Pandas + scikit-learn

---

## TECH STACK — USE EXACTLY THIS, NO SUBSTITUTIONS

**Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, Recharts, Clerk (auth)
**Backend:** FastAPI (Python 3.11+), LangChain, FAISS, Google Gemini API (gemini-1.5-pro), PyMuPDF, Pandas, NumPy, scikit-learn, Motor (async MongoDB), ElevenLabs API
**Database:** MongoDB Atlas
**Auth:** Clerk (frontend) + Clerk JWT verification (backend)
**Deploy:** Vercel (frontend), Render (backend)

---

## PROJECT FOLDER STRUCTURE — CREATE THIS EXACTLY

```
interviewiq/
├── frontend/                          ← Next.js app
│   ├── app/
│   │   ├── layout.tsx                 ← Root layout with ClerkProvider
│   │   ├── page.tsx                   ← Landing page
│   │   ├── (auth)/
│   │   │   ├── sign-in/page.tsx
│   │   │   └── sign-up/page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx               ← User dashboard, past sessions
│   │   ├── interview/
│   │   │   ├── setup/page.tsx         ← Resume upload + role selection
│   │   │   ├── [sessionId]/page.tsx   ← Live interview page
│   │   │   └── report/[sessionId]/page.tsx ← Performance report
│   │   └── progress/
│   │       └── page.tsx               ← Multi-session analytics
│   ├── components/
│   │   ├── ui/                        ← Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Badge.tsx
│   │   ├── interview/
│   │   │   ├── VoiceRecorder.tsx      ← Web Speech API recording
│   │   │   ├── AudioPlayer.tsx        ← ElevenLabs audio playback
│   │   │   ├── QuestionDisplay.tsx    ← Shows current question
│   │   │   ├── ConversationHistory.tsx
│   │   │   └── InterviewTimer.tsx
│   │   ├── report/
│   │   │   ├── ScoreCard.tsx
│   │   │   ├── CategoryChart.tsx      ← Recharts radar chart
│   │   │   ├── QuestionBreakdown.tsx
│   │   │   └── StudyRecommendations.tsx
│   │   └── dashboard/
│   │       ├── SessionCard.tsx
│   │       └── ProgressChart.tsx
│   ├── store/
│   │   └── interviewStore.ts          ← Zustand global state
│   ├── lib/
│   │   ├── api.ts                     ← All API call functions
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts                   ← All TypeScript interfaces
│   ├── middleware.ts                  ← Clerk auth middleware
│   ├── .env.local
│   └── package.json
│
├── backend/                           ← FastAPI app
│   ├── main.py                        ← FastAPI app entry point
│   ├── config.py                      ← All env vars + settings
│   ├── database.py                    ← MongoDB Motor connection
│   ├── auth.py                        ← Clerk JWT verification middleware
│   ├── routes/
│   │   ├── resume.py                  ← POST /resume/upload + parse
│   │   ├── interview.py               ← POST /interview/start, /next-question, /end
│   │   ├── evaluation.py              ← POST /evaluate/answer (internal)
│   │   ├── voice.py                   ← POST /voice/synthesize (ElevenLabs)
│   │   └── analytics.py              ← GET /analytics/report, /progress
│   ├── services/
│   │   ├── rag_service.py             ← PDF parsing + LangChain + FAISS
│   │   ├── gemini_service.py          ← All Gemini API calls
│   │   ├── elevenlabs_service.py      ← Text to speech
│   │   ├── analytics_service.py       ← Pandas + sklearn processing
│   │   └── session_service.py         ← Session state management
│   ├── prompts/
│   │   ├── resume_parser.py           ← Step 0 prompt
│   │   ├── session_init.py            ← Step 1 prompt
│   │   ├── question_generator.py      ← Step 2 + Step 4 prompts
│   │   ├── answer_evaluator.py        ← Step 3 prompt
│   │   ├── report_generator.py        ← Step 7 prompt
│   │   └── progress_analyzer.py       ← Step 8 prompt
│   ├── models/
│   │   ├── session.py                 ← Pydantic models for sessions
│   │   ├── evaluation.py              ← Pydantic models for evaluations
│   │   └── user.py                    ← Pydantic models for users
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

## PHASE 1 — BACKEND FOUNDATION

### Step 1.1 — Create requirements.txt

```
fastapi==0.111.0
uvicorn==0.29.0
python-multipart==0.0.9
motor==3.4.0
pymongo==4.7.2
pydantic==2.7.1
python-dotenv==1.0.1
PyMuPDF==1.24.3
langchain==0.2.0
langchain-google-genai==1.0.3
langchain-community==0.2.0
faiss-cpu==1.8.0
google-generativeai==0.5.4
pandas==2.2.2
numpy==1.26.4
scikit-learn==1.4.2
httpx==0.27.0
python-jose==3.3.0
requests==2.31.0
elevenlabs==1.2.0
```

### Step 1.2 — Create backend/.env

```
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URL=your_mongodb_atlas_url
MONGODB_DB_NAME=interviewiq
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_JWT_PUBLIC_KEY=your_clerk_jwt_public_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
FRONTEND_URL=http://localhost:3000
```

### Step 1.3 — Create config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str
    mongodb_url: str
    mongodb_db_name: str = "interviewiq"
    clerk_secret_key: str
    clerk_jwt_public_key: str
    elevenlabs_api_key: str
    elevenlabs_voice_id: str
    frontend_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Step 1.4 — Create database.py

```python
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client = AsyncIOMotorClient(settings.mongodb_url)
db = client[settings.mongodb_db_name]

# Collections
sessions_collection = db["sessions"]
evaluations_collection = db["evaluations"]
users_collection = db["users"]
resumes_collection = db["resumes"]

async def create_indexes():
    await sessions_collection.create_index("user_id")
    await sessions_collection.create_index("created_at")
    await evaluations_collection.create_index("session_id")
    await resumes_collection.create_index("user_id")
```

### Step 1.5 — Create auth.py (Clerk JWT Verification)

```python
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
from config import settings

security = HTTPBearer()

async def verify_clerk_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.clerk.com/v1/tokens/verify",
                headers={
                    "Authorization": f"Bearer {settings.clerk_secret_key}",
                    "Content-Type": "application/json"
                },
                params={"token": token}
            )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        data = response.json()
        return data.get("sub")  # returns clerk user_id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
```

### Step 1.6 — Create main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import create_indexes
from routes import resume, interview, voice, analytics
from config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_indexes()
    yield

app = FastAPI(title="InterviewIQ API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(interview.router, prefix="/interview", tags=["Interview"])
app.include_router(voice.router, prefix="/voice", tags=["Voice"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "InterviewIQ API"}
```

---

## PHASE 2 — ALL PROMPTS (Create these exactly in backend/prompts/)

### Step 2.1 — resume_parser.py

```python
RESUME_PARSER_PROMPT = """
You are an expert technical recruiter with 10 years of experience at top tech companies. 
Analyze this resume and extract structured information. 
Only extract what is explicitly stated. Do not infer or assume.

Resume Text:
{resume_text}

Respond ONLY in valid JSON with this exact structure, no markdown, no explanation:
{{
  "candidate_name": "",
  "education": {{
    "degree": "",
    "institution": "",
    "cgpa": "",
    "graduation_year": "",
    "relevant_coursework": []
  }},
  "technical_skills": {{
    "languages": [],
    "frontend": [],
    "backend": [],
    "databases": [],
    "ai_ml": [],
    "tools": [],
    "cloud": []
  }},
  "projects": [
    {{
      "name": "",
      "description": "",
      "tech_stack": [],
      "key_features": [],
      "complexity_level": "beginner|intermediate|advanced",
      "has_ai_integration": false,
      "interview_worthy_points": []
    }}
  ],
  "strongest_areas": [],
  "potential_weak_areas": [],
  "most_impressive_achievement": "",
  "suggested_interview_focus": []
}}
"""
```

### Step 2.2 — session_init.py

```python
SESSION_INIT_PROMPT = """
You are Alex, a senior technical interviewer with 12 years of experience 
hiring engineers at Google, Stripe, and top-tier startups.

Candidate Profile:
{parsed_resume}

Role: {role}
Interview Type: {interview_type}
Difficulty: {difficulty}

Create an interview strategy for this specific candidate.
Respond ONLY in valid JSON, no markdown:
{{
  "strategy": {{
    "primary_focus_areas": [],
    "secondary_areas": [],
    "opening_question": "",
    "opening_question_reasoning": "",
    "strong_answer_followups": [],
    "weak_answer_followups": [],
    "topics_to_cover": [],
    "estimated_question_distribution": {{}}
  }}
}}
"""
```

### Step 2.3 — question_generator.py

```python
FIRST_QUESTION_PROMPT = """
You are Alex, a senior technical interviewer. You ask ONE question at a time.
Never ask multiple questions. Never explain why you are asking. Sound human.
Do not start with "Certainly", "Of course", "Great", or any filler.

Candidate Profile:
{parsed_resume}

Role: {role}
Interview Strategy: {strategy}

This is the START of the interview. Ask your first question.
Make it specific to THIS candidate's actual background.
Reference something real from their resume.
Maximum 3 sentences. ONE question only.

Respond with ONLY the question text. Nothing else.
"""

NEXT_QUESTION_PROMPT = """
You are Alex, a senior technical interviewer in a live interview.
You ask ONE question at a time. You never repeat topics already covered well.

Candidate Profile:
{parsed_resume}
Role: {role}
Strategy: {strategy}

Full Conversation So Far:
{conversation_history}

Last Answer Quality: {last_answer_quality}
Last Answer Gap: {last_answer_gap}
Questions Asked: {questions_asked}/10
Topics Covered: {topics_covered}
Topics Remaining: {topics_remaining}

Decision Rules:
- If last answer was "weak" or "very_weak": follow up on same topic, probe the specific gap
- If last answer was "strong": move to next uncovered topic
- If last answer was "acceptable": your judgment call
- If questions_asked >= 10: respond with exactly INTERVIEW_COMPLETE

Reference their actual words naturally when following up.
ONE question only. Maximum 3 sentences.
Respond with ONLY the question text or INTERVIEW_COMPLETE.
"""

NUDGE_PROMPT = """
You are Alex, a senior technical interviewer. 
The candidate seems stuck on: {current_question}
Their relevant background: {relevant_background}

Give ONE brief nudge (1 sentence maximum).
Point them in a direction but never give the answer.
Sound like a human interviewer, not a robot.
Do not say "Hint:" or "Here's a hint".

Respond with ONLY the nudge text.
"""
```

### Step 2.4 — answer_evaluator.py

```python
ANSWER_EVALUATOR_PROMPT = """
You are an expert technical interview evaluator. You are honest and strict.
Score based on what was actually said. No benefit of the doubt.

Question: {question}
Candidate Answer: {answer}
Relevant Background: {relevant_background}
Role: {role}
Difficulty: {difficulty}

Evaluate strictly. Respond ONLY in valid JSON, no markdown:
{{
  "scores": {{
    "technical_accuracy": 0,
    "depth": 0,
    "personal_experience": 0,
    "communication": 0,
    "confidence": 0
  }},
  "overall_score": 0,
  "answer_quality": "strong|acceptable|weak|very_weak",
  "what_they_got_right": "",
  "what_they_missed": "",
  "red_flags": [],
  "topic_covered": "",
  "should_follow_up": false,
  "follow_up_reason": ""
}}

Score 0-10 for each dimension. overall_score is weighted average.
"""
```

### Step 2.5 — report_generator.py

```python
REPORT_GENERATOR_PROMPT = """
You are an expert career coach and technical interview assessor.
Give honest, actionable, specific feedback. Be constructive not cruel.

Candidate: {candidate_name}
Role Applied: {role}
Difficulty: {difficulty}

Full Interview Transcript:
{transcript}

All Evaluation Data:
{all_evaluations}

Generate complete report. Respond ONLY in valid JSON, no markdown:
{{
  "overall_score": 0,
  "overall_grade": "A|B|C|D|F",
  "hire_recommendation": "Strong Yes|Yes|Maybe|No|Strong No",
  "category_scores": {{
    "technical_knowledge": 0,
    "project_depth": 0,
    "system_design": 0,
    "problem_solving": 0,
    "communication": 0,
    "dsa_fundamentals": 0
  }},
  "strengths": [
    {{ "area": "", "evidence": "", "score": 0 }}
  ],
  "weaknesses": [
    {{
      "area": "",
      "specific_gap": "",
      "what_was_said": "",
      "what_should_have_been_said": "",
      "score": 0
    }}
  ],
  "question_by_question": [
    {{ "question": "", "answer_summary": "", "score": 0, "feedback": "" }}
  ],
  "study_recommendations": [
    {{
      "topic": "",
      "why": "",
      "resource": "",
      "priority": "high|medium|low"
    }}
  ],
  "biggest_win": "",
  "most_critical_gap": "",
  "one_thing_to_fix_immediately": ""
}}
"""
```

### Step 2.6 — progress_analyzer.py

```python
PROGRESS_ANALYZER_PROMPT = """
You are a senior career coach tracking a candidate's interview progress.
You identify patterns and give honest growth analysis.

Candidate: {candidate_name}
Target Role: {role}
Sessions Completed: {session_count}

Session History:
{sessions_summary}

Analytics Data:
{analytics_data}

Generate progress report. Respond ONLY in valid JSON, no markdown:
{{
  "overall_trajectory": "improving|stagnant|declining",
  "improvement_rate": "fast|steady|slow|none",
  "consistent_strengths": [],
  "persistent_weaknesses": [],
  "resolved_weaknesses": [],
  "readiness_assessment": {{
    "ready_for_interviews": false,
    "estimated_weeks_to_ready": 0,
    "confidence_level": "high|medium|low"
  }},
  "this_week_focus": "",
  "motivational_note": ""
}}
"""
```

---

## PHASE 3 — BACKEND SERVICES

### Step 3.1 — Create services/rag_service.py

Build the complete RAG pipeline:

```python
import fitz  # PyMuPDF
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
import json
import google.generativeai as genai
from config import settings
from prompts.resume_parser import RESUME_PARSER_PROMPT

genai.configure(api_key=settings.gemini_api_key)

class RAGService:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=settings.gemini_api_key
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ".", " "]
        )
    
    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text.strip()
    
    def create_vector_store(self, resume_text: str) -> FAISS:
        chunks = self.text_splitter.split_text(resume_text)
        documents = [Document(page_content=chunk) for chunk in chunks]
        vector_store = FAISS.from_documents(documents, self.embeddings)
        return vector_store
    
    def get_relevant_context(self, vector_store: FAISS, query: str, k: int = 3) -> str:
        docs = vector_store.similarity_search(query, k=k)
        return "\n".join([doc.page_content for doc in docs])
    
    async def parse_resume(self, resume_text: str) -> dict:
        model = genai.GenerativeModel(
            "gemini-1.5-pro",
            generation_config={"temperature": 0.1}
        )
        prompt = RESUME_PARSER_PROMPT.format(resume_text=resume_text)
        response = model.generate_content(prompt)
        
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        
        return json.loads(raw.strip())

rag_service = RAGService()
```

### Step 3.2 — Create services/gemini_service.py

```python
import google.generativeai as genai
import json
from config import settings
from prompts.session_init import SESSION_INIT_PROMPT
from prompts.question_generator import FIRST_QUESTION_PROMPT, NEXT_QUESTION_PROMPT, NUDGE_PROMPT
from prompts.answer_evaluator import ANSWER_EVALUATOR_PROMPT
from prompts.report_generator import REPORT_GENERATOR_PROMPT

genai.configure(api_key=settings.gemini_api_key)

class GeminiService:
    
    def _get_model(self, temperature: float = 0.7):
        return genai.GenerativeModel(
            "gemini-1.5-pro",
            generation_config={"temperature": temperature}
        )
    
    def _parse_json_response(self, text: str) -> dict:
        raw = text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    
    async def initialize_session(self, parsed_resume: dict, role: str, 
                                  interview_type: str, difficulty: str) -> dict:
        model = self._get_model(temperature=0.3)
        prompt = SESSION_INIT_PROMPT.format(
            parsed_resume=json.dumps(parsed_resume, indent=2),
            role=role,
            interview_type=interview_type,
            difficulty=difficulty
        )
        response = model.generate_content(prompt)
        return self._parse_json_response(response.text)
    
    async def generate_first_question(self, parsed_resume: dict, 
                                       role: str, strategy: dict) -> str:
        model = self._get_model(temperature=0.8)
        prompt = FIRST_QUESTION_PROMPT.format(
            parsed_resume=json.dumps(parsed_resume, indent=2),
            role=role,
            strategy=json.dumps(strategy, indent=2)
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    
    async def generate_next_question(self, parsed_resume: dict, role: str,
                                      strategy: dict, conversation_history: list,
                                      last_evaluation: dict, questions_asked: int,
                                      topics_covered: list, topics_remaining: list) -> str:
        model = self._get_model(temperature=0.8)
        
        history_text = "\n".join([
            f"Q{i+1}: {item['question']}\nA: {item['answer']}\nQuality: {item.get('quality', 'N/A')}"
            for i, item in enumerate(conversation_history)
        ])
        
        prompt = NEXT_QUESTION_PROMPT.format(
            parsed_resume=json.dumps(parsed_resume, indent=2),
            role=role,
            strategy=json.dumps(strategy, indent=2),
            conversation_history=history_text,
            last_answer_quality=last_evaluation.get("answer_quality", "acceptable"),
            last_answer_gap=last_evaluation.get("what_they_missed", ""),
            questions_asked=questions_asked,
            topics_covered=", ".join(topics_covered),
            topics_remaining=", ".join(topics_remaining)
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    
    async def evaluate_answer(self, question: str, answer: str,
                               relevant_background: str, role: str, difficulty: str) -> dict:
        model = self._get_model(temperature=0.1)
        prompt = ANSWER_EVALUATOR_PROMPT.format(
            question=question,
            answer=answer,
            relevant_background=relevant_background,
            role=role,
            difficulty=difficulty
        )
        response = model.generate_content(prompt)
        return self._parse_json_response(response.text)
    
    async def generate_nudge(self, current_question: str, relevant_background: str) -> str:
        model = self._get_model(temperature=0.7)
        prompt = NUDGE_PROMPT.format(
            current_question=current_question,
            relevant_background=relevant_background
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    
    async def generate_report(self, candidate_name: str, role: str, difficulty: str,
                               transcript: list, all_evaluations: list) -> dict:
        model = self._get_model(temperature=0.2)
        
        transcript_text = "\n".join([
            f"Q{i+1}: {item['question']}\nA: {item['answer']}"
            for i, item in enumerate(transcript)
        ])
        
        prompt = REPORT_GENERATOR_PROMPT.format(
            candidate_name=candidate_name,
            role=role,
            difficulty=difficulty,
            transcript=transcript_text,
            all_evaluations=json.dumps(all_evaluations, indent=2)
        )
        response = model.generate_content(prompt)
        return self._parse_json_response(response.text)

gemini_service = GeminiService()
```

### Step 3.3 — Create services/elevenlabs_service.py

```python
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
                raise Exception(f"ElevenLabs error: {response.status_code} - {response.text}")

elevenlabs_service = ElevenLabsService()
```

### Step 3.4 — Create services/analytics_service.py

```python
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import json

class AnalyticsService:
    
    def analyze_session_scores(self, evaluations: list) -> dict:
        if not evaluations:
            return {}
        
        df = pd.DataFrame(evaluations)
        
        category_scores = {}
        if 'topic_covered' in df.columns and 'overall_score' in df.columns:
            category_scores = df.groupby('topic_covered')['overall_score'].mean().to_dict()
        
        scores = df['overall_score'].tolist() if 'overall_score' in df.columns else []
        
        return {
            "average_score": float(df['overall_score'].mean()) if 'overall_score' in df.columns else 0,
            "highest_score": float(df['overall_score'].max()) if 'overall_score' in df.columns else 0,
            "lowest_score": float(df['overall_score'].min()) if 'overall_score' in df.columns else 0,
            "score_trend": scores,
            "category_breakdown": {k: round(float(v), 2) for k, v in category_scores.items()},
            "weak_areas": [k for k, v in category_scores.items() if v < 5],
            "strong_areas": [k for k, v in category_scores.items() if v >= 7]
        }
    
    def analyze_multi_session_progress(self, all_sessions: list) -> dict:
        if len(all_sessions) < 2:
            return {"message": "Need at least 2 sessions for progress analysis"}
        
        session_averages = []
        for session in all_sessions:
            evals = session.get('evaluations', [])
            if evals:
                avg = np.mean([e.get('overall_score', 0) for e in evals])
                session_averages.append({
                    'session_number': session.get('session_number', 0),
                    'average_score': float(avg),
                    'date': session.get('created_at', '')
                })
        
        df = pd.DataFrame(session_averages)
        
        if len(df) >= 2:
            scores = df['average_score'].values
            slope = np.polyfit(range(len(scores)), scores, 1)[0]
            
            if slope > 0.3:
                trajectory = "improving"
            elif slope < -0.3:
                trajectory = "declining"
            else:
                trajectory = "stagnant"
        else:
            trajectory = "insufficient_data"
        
        all_weak = []
        for session in all_sessions:
            evals = session.get('evaluations', [])
            for e in evals:
                if e.get('overall_score', 10) < 5:
                    all_weak.append(e.get('topic_covered', 'unknown'))
        
        weak_counts = pd.Series(all_weak).value_counts().to_dict() if all_weak else {}
        persistent_weak = [k for k, v in weak_counts.items() if v >= 2]
        
        return {
            "trajectory": trajectory,
            "session_scores": session_averages,
            "persistent_weak_areas": persistent_weak,
            "weak_area_frequency": weak_counts,
            "latest_average": float(df['average_score'].iloc[-1]) if not df.empty else 0,
            "first_average": float(df['average_score'].iloc[0]) if not df.empty else 0,
            "total_improvement": float(df['average_score'].iloc[-1] - df['average_score'].iloc[0]) if len(df) >= 2 else 0
        }

analytics_service = AnalyticsService()
```

---

## PHASE 4 — BACKEND ROUTES

### Step 4.1 — Create routes/resume.py

```python
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from auth import verify_clerk_token
from services.rag_service import rag_service
from database import resumes_collection
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(verify_clerk_token)
):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    
    pdf_bytes = await file.read()
    
    if len(pdf_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")
    
    resume_text = rag_service.extract_text_from_pdf(pdf_bytes)
    
    if not resume_text or len(resume_text) < 100:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    parsed_resume = await rag_service.parse_resume(resume_text)
    
    resume_doc = {
        "resume_id": str(uuid.uuid4()),
        "user_id": user_id,
        "raw_text": resume_text,
        "parsed_data": parsed_resume,
        "created_at": datetime.utcnow()
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
```

### Step 4.2 — Create routes/interview.py

Build these endpoints completely:

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from auth import verify_clerk_token
from services.gemini_service import gemini_service
from services.rag_service import rag_service
from services.analytics_service import analytics_service
from database import sessions_collection, resumes_collection, evaluations_collection
from datetime import datetime
import uuid
import json

router = APIRouter()

class StartInterviewRequest(BaseModel):
    resume_id: str
    role: str
    interview_type: str = "Mixed"
    difficulty: str = "Junior"

class SubmitAnswerRequest(BaseModel):
    session_id: str
    answer: str
    request_nudge: bool = False

class EndInterviewRequest(BaseModel):
    session_id: str

@router.post("/start")
async def start_interview(
    request: StartInterviewRequest,
    user_id: str = Depends(verify_clerk_token)
):
    resume_doc = await resumes_collection.find_one({"resume_id": request.resume_id})
    if not resume_doc:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    parsed_resume = resume_doc["parsed_data"]
    
    strategy_data = await gemini_service.initialize_session(
        parsed_resume=parsed_resume,
        role=request.role,
        interview_type=request.interview_type,
        difficulty=request.difficulty
    )
    
    first_question = await gemini_service.generate_first_question(
        parsed_resume=parsed_resume,
        role=request.role,
        strategy=strategy_data
    )
    
    session_id = str(uuid.uuid4())
    
    session_doc = {
        "session_id": session_id,
        "user_id": user_id,
        "resume_id": request.resume_id,
        "parsed_resume": parsed_resume,
        "role": request.role,
        "interview_type": request.interview_type,
        "difficulty": request.difficulty,
        "strategy": strategy_data,
        "conversation": [],
        "evaluations": [],
        "current_question": first_question,
        "questions_asked": 1,
        "topics_covered": [],
        "status": "active",
        "created_at": datetime.utcnow()
    }
    
    await sessions_collection.insert_one(session_doc)
    
    return {
        "session_id": session_id,
        "question": first_question,
        "question_number": 1,
        "status": "active"
    }

@router.post("/answer")
async def submit_answer(
    request: SubmitAnswerRequest,
    user_id: str = Depends(verify_clerk_token)
):
    session = await sessions_collection.find_one({
        "session_id": request.session_id,
        "user_id": user_id
    })
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Interview already completed")
    
    if request.request_nudge:
        nudge = await gemini_service.generate_nudge(
            current_question=session["current_question"],
            relevant_background=str(session["parsed_resume"].get("projects", []))
        )
        return {"nudge": nudge, "type": "nudge"}
    
    vector_store = rag_service.create_vector_store(
        session.get("raw_resume_text", str(session["parsed_resume"]))
    )
    relevant_context = rag_service.get_relevant_context(
        vector_store, session["current_question"]
    )
    
    evaluation = await gemini_service.evaluate_answer(
        question=session["current_question"],
        answer=request.answer,
        relevant_background=relevant_context,
        role=session["role"],
        difficulty=session["difficulty"]
    )
    
    conversation_entry = {
        "question": session["current_question"],
        "answer": request.answer,
        "quality": evaluation.get("answer_quality"),
        "score": evaluation.get("overall_score"),
        "question_number": session["questions_asked"]
    }
    
    updated_conversation = session["conversation"] + [conversation_entry]
    updated_evaluations = session["evaluations"] + [evaluation]
    updated_topics = session["topics_covered"]
    
    topic = evaluation.get("topic_covered", "")
    if topic and topic not in updated_topics:
        updated_topics = updated_topics + [topic]
    
    strategy_topics = session["strategy"].get("strategy", {}).get("topics_to_cover", [])
    topics_remaining = [t for t in strategy_topics if t not in updated_topics]
    
    next_question_text = await gemini_service.generate_next_question(
        parsed_resume=session["parsed_resume"],
        role=session["role"],
        strategy=session["strategy"],
        conversation_history=updated_conversation,
        last_evaluation=evaluation,
        questions_asked=session["questions_asked"],
        topics_covered=updated_topics,
        topics_remaining=topics_remaining
    )
    
    is_complete = (
        next_question_text.strip() == "INTERVIEW_COMPLETE" or
        session["questions_asked"] >= 10
    )
    
    if is_complete:
        await sessions_collection.update_one(
            {"session_id": request.session_id},
            {"$set": {
                "conversation": updated_conversation,
                "evaluations": updated_evaluations,
                "topics_covered": updated_topics,
                "status": "generating_report",
                "completed_at": datetime.utcnow()
            }}
        )
        
        report = await gemini_service.generate_report(
            candidate_name=session["parsed_resume"].get("candidate_name", "Candidate"),
            role=session["role"],
            difficulty=session["difficulty"],
            transcript=updated_conversation,
            all_evaluations=updated_evaluations
        )
        
        analytics = analytics_service.analyze_session_scores(updated_evaluations)
        
        await sessions_collection.update_one(
            {"session_id": request.session_id},
            {"$set": {
                "status": "completed",
                "report": report,
                "analytics": analytics
            }}
        )
        
        return {
            "status": "complete",
            "message": "Interview completed",
            "session_id": request.session_id,
            "overall_score": report.get("overall_score"),
            "redirect_to": f"/interview/report/{request.session_id}"
        }
    
    await sessions_collection.update_one(
        {"session_id": request.session_id},
        {"$set": {
            "conversation": updated_conversation,
            "evaluations": updated_evaluations,
            "topics_covered": updated_topics,
            "current_question": next_question_text,
            "questions_asked": session["questions_asked"] + 1
        }}
    )
    
    return {
        "status": "active",
        "question": next_question_text,
        "question_number": session["questions_asked"] + 1,
        "evaluation_preview": {
            "score": evaluation.get("overall_score"),
            "quality": evaluation.get("answer_quality")
        }
    }

@router.get("/report/{session_id}")
async def get_report(
    session_id: str,
    user_id: str = Depends(verify_clerk_token)
):
    session = await sessions_collection.find_one({
        "session_id": session_id,
        "user_id": user_id
    })
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["status"] != "completed":
        raise HTTPException(status_code=400, detail="Report not ready yet")
    
    return {
        "session_id": session_id,
        "role": session["role"],
        "difficulty": session["difficulty"],
        "report": session.get("report", {}),
        "analytics": session.get("analytics", {}),
        "completed_at": session.get("completed_at")
    }

@router.get("/sessions")
async def get_user_sessions(user_id: str = Depends(verify_clerk_token)):
    cursor = sessions_collection.find(
        {"user_id": user_id, "status": "completed"},
        {"conversation": 0, "evaluations": 0, "strategy": 0, "parsed_resume": 0}
    ).sort("created_at", -1).limit(20)
    
    sessions = []
    async for session in cursor:
        session["_id"] = str(session["_id"])
        sessions.append(session)
    
    return {"sessions": sessions}
```

### Step 4.3 — Create routes/voice.py

```python
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from auth import verify_clerk_token
from services.elevenlabs_service import elevenlabs_service

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
        raise HTTPException(status_code=500, detail=f"Voice synthesis failed: {str(e)}")
```

### Step 4.4 — Create routes/analytics.py

```python
from fastapi import APIRouter, HTTPException, Depends
from auth import verify_clerk_token
from database import sessions_collection
from services.analytics_service import analytics_service
from services.gemini_service import gemini_service
from prompts.progress_analyzer import PROGRESS_ANALYZER_PROMPT
import json

router = APIRouter()

@router.get("/progress")
async def get_progress(user_id: str = Depends(verify_clerk_token)):
    cursor = sessions_collection.find(
        {"user_id": user_id, "status": "completed"}
    ).sort("created_at", 1)
    
    all_sessions = []
    session_number = 1
    async for session in cursor:
        all_sessions.append({
            "session_number": session_number,
            "role": session.get("role"),
            "difficulty": session.get("difficulty"),
            "evaluations": session.get("evaluations", []),
            "created_at": str(session.get("created_at")),
            "overall_score": session.get("report", {}).get("overall_score", 0)
        })
        session_number += 1
    
    if len(all_sessions) < 2:
        return {
            "message": "Complete at least 2 interviews to see progress analytics",
            "sessions_completed": len(all_sessions)
        }
    
    multi_analytics = analytics_service.analyze_multi_session_progress(all_sessions)
    
    return {
        "sessions_completed": len(all_sessions),
        "analytics": multi_analytics
    }
```

---

## PHASE 5 — FRONTEND

### Step 5.1 — Setup Next.js

```bash
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir
cd frontend
npm install @clerk/nextjs zustand recharts axios
```

### Step 5.2 — frontend/.env.local

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 5.3 — Create types/index.ts

```typescript
export interface ParsedResume {
  candidate_name: string;
  education: {
    degree: string;
    institution: string;
    cgpa: string;
    graduation_year: string;
  };
  technical_skills: {
    languages: string[];
    frontend: string[];
    backend: string[];
    databases: string[];
    ai_ml: string[];
    tools: string[];
    cloud: string[];
  };
  projects: Project[];
  strongest_areas: string[];
  potential_weak_areas: string[];
}

export interface Project {
  name: string;
  description: string;
  tech_stack: string[];
  key_features: string[];
  complexity_level: string;
  has_ai_integration: boolean;
  interview_worthy_points: string[];
}

export interface InterviewSession {
  session_id: string;
  question: string;
  question_number: number;
  status: 'active' | 'complete';
}

export interface EvaluationPreview {
  score: number;
  quality: 'strong' | 'acceptable' | 'weak' | 'very_weak';
}

export interface Report {
  overall_score: number;
  overall_grade: string;
  hire_recommendation: string;
  category_scores: {
    technical_knowledge: number;
    project_depth: number;
    system_design: number;
    problem_solving: number;
    communication: number;
    dsa_fundamentals: number;
  };
  strengths: Array<{ area: string; evidence: string; score: number }>;
  weaknesses: Array<{
    area: string;
    specific_gap: string;
    what_was_said: string;
    what_should_have_been_said: string;
    score: number;
  }>;
  question_by_question: Array<{
    question: string;
    answer_summary: string;
    score: number;
    feedback: string;
  }>;
  study_recommendations: Array<{
    topic: string;
    why: string;
    resource: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  biggest_win: string;
  most_critical_gap: string;
  one_thing_to_fix_immediately: string;
}

export type Role = 'Full Stack Developer' | 'Frontend Developer' | 'Backend Developer' | 'AI/ML Engineer';
export type Difficulty = 'Internship' | 'Junior' | 'Mid-level' | 'Senior';
export type InterviewType = 'Technical' | 'Behavioral' | 'Mixed' | 'System Design';
```

### Step 5.4 — Create store/interviewStore.ts

```typescript
import { create } from 'zustand';
import { ParsedResume, Report } from '@/types';

interface InterviewStore {
  resumeId: string | null;
  parsedResume: ParsedResume | null;
  sessionId: string | null;
  currentQuestion: string | null;
  questionNumber: number;
  conversationHistory: Array<{ question: string; answer: string; score?: number }>;
  isRecording: boolean;
  isAudioPlaying: boolean;
  isLoading: boolean;
  report: Report | null;
  
  setResumeId: (id: string) => void;
  setParsedResume: (resume: ParsedResume) => void;
  setSessionId: (id: string) => void;
  setCurrentQuestion: (q: string) => void;
  setQuestionNumber: (n: number) => void;
  addToHistory: (entry: { question: string; answer: string; score?: number }) => void;
  setIsRecording: (val: boolean) => void;
  setIsAudioPlaying: (val: boolean) => void;
  setIsLoading: (val: boolean) => void;
  setReport: (report: Report) => void;
  reset: () => void;
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  resumeId: null,
  parsedResume: null,
  sessionId: null,
  currentQuestion: null,
  questionNumber: 0,
  conversationHistory: [],
  isRecording: false,
  isAudioPlaying: false,
  isLoading: false,
  report: null,
  
  setResumeId: (id) => set({ resumeId: id }),
  setParsedResume: (resume) => set({ parsedResume: resume }),
  setSessionId: (id) => set({ sessionId: id }),
  setCurrentQuestion: (q) => set({ currentQuestion: q }),
  setQuestionNumber: (n) => set({ questionNumber: n }),
  addToHistory: (entry) => set((state) => ({
    conversationHistory: [...state.conversationHistory, entry]
  })),
  setIsRecording: (val) => set({ isRecording: val }),
  setIsAudioPlaying: (val) => set({ isAudioPlaying: val }),
  setIsLoading: (val) => set({ isLoading: val }),
  setReport: (report) => set({ report }),
  reset: () => set({
    sessionId: null,
    currentQuestion: null,
    questionNumber: 0,
    conversationHistory: [],
    isRecording: false,
    isAudioPlaying: false,
    isLoading: false,
    report: null
  })
}));
```

### Step 5.5 — Create components/interview/VoiceRecorder.tsx

Build complete voice recording component using Web Speech API:
- Show mic button with recording animation
- Use `window.SpeechRecognition` or `window.webkitSpeechRecognition`
- Show live transcript as user speaks
- Auto-stop after 2 seconds of silence
- Return transcript text via onTranscript callback

```typescript
'use client';
import { useState, useEffect, useRef } from 'react';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  isDisabled: boolean;
}

export default function VoiceRecorder({ onTranscript, isDisabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveText, setLiveText] = useState('');
  const recognitionRef = useRef<any>(null);
  
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += text;
        else interim += text;
      }
      setLiveText(interim);
      if (final) setTranscript(prev => prev + ' ' + final);
    };
    
    recognitionRef.current = recognition;
  }, []);
  
  const startRecording = () => {
    setTranscript('');
    setLiveText('');
    setIsRecording(true);
    recognitionRef.current?.start();
  };
  
  const stopRecording = () => {
    setIsRecording(false);
    recognitionRef.current?.stop();
    const finalText = transcript.trim();
    if (finalText) onTranscript(finalText);
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="min-h-24 w-full bg-gray-50 rounded-xl p-4 text-gray-700 text-sm">
        {transcript || liveText || (isRecording ? 'Listening...' : 'Your answer will appear here')}
        {liveText && <span className="text-gray-400"> {liveText}</span>}
      </div>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isDisabled}
        className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold transition-all
          ${isRecording 
            ? 'bg-red-500 animate-pulse scale-110' 
            : 'bg-blue-600 hover:bg-blue-700'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {isRecording ? '⏹' : '🎤'}
      </button>
      <p className="text-sm text-gray-500">
        {isRecording ? 'Click to stop recording' : 'Click to start answering'}
      </p>
    </div>
  );
}
```

### Step 5.6 — Create components/interview/AudioPlayer.tsx

```typescript
'use client';
import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

interface AudioPlayerProps {
  text: string;
  onComplete: () => void;
  autoPlay: boolean;
}

export default function AudioPlayer({ text, onComplete, autoPlay }: AudioPlayerProps) {
  const { getToken } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (!text || !autoPlay) return;
    
    const playAudio = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/voice/synthesize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text })
        });
        
        if (!response.ok) throw new Error('Voice synthesis failed');
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          audioRef.current.onended = () => {
            URL.revokeObjectURL(audioUrl);
            onComplete();
          };
        }
      } catch (error) {
        console.error('Audio error:', error);
        onComplete();
      }
    };
    
    playAudio();
  }, [text, autoPlay]);
  
  return <audio ref={audioRef} className="hidden" />;
}
```

### Step 5.7 — Create app/interview/[sessionId]/page.tsx

Build the complete live interview page with:
- Question display area (shows current question text)
- AudioPlayer (auto-plays question via ElevenLabs)
- VoiceRecorder (records user answer)
- Submit button that calls /interview/answer
- Progress indicator (Question 3/10)
- "Need a hint?" button
- Loading state while AI generates next question
- Smooth transitions between questions
- On complete → redirect to report page

### Step 5.8 — Create app/interview/report/[sessionId]/page.tsx

Build the complete report page with:
- Overall score (big number, colored by grade)
- Recharts RadarChart for category scores
- Strengths section (green cards)
- Weaknesses section (red cards with specific gap + what should have been said)
- Question by question breakdown (expandable)
- Study recommendations (sorted by priority)
- "Practice Again" button

### Step 5.9 — Create app/dashboard/page.tsx

Build dashboard with:
- Welcome message with candidate name from resume
- "Start New Interview" button
- Past sessions list (role, date, score, grade)
- Quick stats (total sessions, average score, best score)
- Link to progress analytics

---

## PHASE 6 — FINAL INTEGRATION CHECKLIST

After building all phases, verify these work end-to-end:

```
✅ Clerk login/signup works
✅ Resume upload → parsing → stored in MongoDB
✅ Interview start → first question generated and spoken via ElevenLabs
✅ Answer submission → silent evaluation → next question generated
✅ 10 questions → INTERVIEW_COMPLETE → report generated
✅ Report page shows all data with charts
✅ Dashboard shows past sessions
✅ All API calls include Clerk JWT token
✅ CORS configured properly
✅ Error states handled in frontend
✅ Loading states shown during API calls
```

---

## IMPORTANT NOTES FOR THE AI AGENT

1. Write EVERY file completely — do not say "add your implementation here"
2. Never use placeholder comments like `// TODO` or `// implement this`
3. Handle all error cases — network failures, empty responses, invalid JSON from Gemini
4. Every API call in frontend must include the Clerk JWT token via `getToken()`
5. All Gemini responses must be JSON-parsed safely with try/catch
6. Temperature settings matter — use 0.1 for evaluation, 0.8 for question generation
7. Session state must be stored in MongoDB — never in memory (backend restarts)
8. Test each phase in Postman before building the next one
9. VoiceRecorder falls back gracefully if Web Speech API not supported (show text input instead)
10. Mobile responsive design — interview must work on phone too

---

## START HERE — BUILD IN THIS EXACT ORDER

1. Backend foundation (main.py, config, database, auth)
2. All prompt files
3. RAG service + test with a sample PDF in Postman
4. Gemini service + test question generation in Postman
5. All routes + test full interview flow in Postman
6. ElevenLabs service
7. Analytics service
8. Frontend setup + Clerk auth
9. Resume upload page
10. Live interview page (most complex)
11. Report page
12. Dashboard
13. Progress analytics page
14. End-to-end test
15. Deploy backend to Render, frontend to Vercel

---
*InterviewIQ — Built by Aman Kumar Singh*
