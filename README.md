<div align="center">
  

  # 🎯 InterviewIQ

  **AI-Powered Mock Interview Platform with Real-Time Voice & RAG**

  Practice smarter. Interview better. Land the job.

  [![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)](#)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)
  [![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)](#)
  [![Stars](https://img.shields.io/github/stars/amansingh4012/InterviewIQ?style=for-the-badge)](https://github.com/amansingh4012/InterviewIQ)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](#-contributing)

  [Live Demo](#) · [Report Bug](https://github.com/amansingh4012/InterviewIQ/issues) · [Request Feature](https://github.com/amansingh4012/InterviewIQ/issues)

</div>

---

## 📑 Table of Contents

- [🚀 Overview](#-overview)
- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [🏗 Architecture](#-architecture)
- [🛣 Workflow / How It Works](#-workflow--how-it-works)
- [📂 Project Structure](#-project-structure)
- [🏁 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
  - [Running with Docker](#running-with-docker)
- [🔌 API Reference](#-api-reference)
- [📸 Screenshots / Demo](#-screenshots--demo)
- [🚢 Deployment Guide](#-deployment-guide)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [📫 Contact / Author](#-contact--author)

---

## 🚀 Overview

**InterviewIQ** is a full-stack, AI-powered mock interview platform that transforms how professionals prepare for technical interviews. It combines **Retrieval-Augmented Generation (RAG)**, **high-speed LLM inference via Groq**, and **realistic voice synthesis through ElevenLabs** to create an immersive, end-to-end interview simulation.

### Why InterviewIQ?

Most interview prep tools give you a static list of questions. InterviewIQ is different:

- 🧬 **Resume-Aware** — Questions are dynamically generated from _your_ resume, targeting _your_ experience gaps.
- 🗣️ **Voice-First** — Hear questions spoken aloud and respond naturally, simulating a real phone/video screen.
- 📊 **Data-Driven Feedback** — Every answer is scored across 5 dimensions with actionable, AI-generated coaching.
- 🔄 **Adaptive Difficulty** — The interview adjusts in real time based on your performance.

### Who Is It For?

- 👨‍💻 Software engineers preparing for technical interviews
- 🎓 Students and bootcamp graduates entering the job market
- 🔄 Career changers looking to benchmark their readiness
- 👩‍🏫 Career coaches seeking an AI-assisted tool for their clients

---

## ✨ Features

### 🧠 AI-Powered Intelligence
- **Resume Parsing & Context Extraction** — Upload a PDF; LangChain + FAISS vectorize your experience into a semantic knowledge base
- **Dynamic Question Generation** — Groq-powered LLM crafts role-specific, difficulty-calibrated questions tailored to your background
- **Smart Follow-Ups** — The AI decides whether to probe deeper or pivot topics based on your answer quality
- **Nudge System** — Stuck? Request a contextual hint without revealing the full answer

### 🎤 Voice Interaction
- **Text-to-Speech (TTS)** — ElevenLabs produces natural, human-like audio for every question
- **Sarvam AI Fallback** — Automatic failover to an alternative TTS provider for uninterrupted sessions
- **Voice Recording** — Record your spoken answers directly in the browser

### 📊 Performance Analytics
- **5-Dimension Scoring** — Technical Accuracy, Depth, Personal Experience, Communication, and Confidence
- **Session Reports** — AI-generated comprehensive reports with strengths, weaknesses, and study recommendations
- **Multi-Session Progress Tracking** — Recharts-powered dashboards visualizing your improvement over time
- **AI Coaching Insights** — Personalized coaching notes, readiness assessments, and weekly focus areas

### 🔐 Security & Scalability
- **Clerk Authentication** — Seamless sign-up/sign-in with JWT verification on every API call
- **IDOR Prevention** — Ownership checks on all resource access (resumes, sessions, reports)
- **Rate Limiting** — SlowAPI-powered request throttling (60 req/min default)
- **Security Headers** — HSTS, X-Frame-Options, CSP, XSS protection out of the box
- **Input Validation** — Pydantic models with strict field validators and sanitization

---

## 🛠 Tech Stack

### Frontend

| Technology       | Purpose                       | Version    |
| :--------------- | :---------------------------- | :--------- |
| **Next.js**      | App Router, SSR, Routing      | `16.2.1`   |
| **React**        | Component Rendering           | `19.2.4`   |
| **TypeScript**   | Type-Safe Development         | `^5`       |
| **Tailwind CSS** | Utility-First Styling         | `^4`       |
| **Zustand**      | Lightweight State Management  | `5.0.12`   |
| **Clerk**        | Auth UI Components & Hooks    | `7.0.7`    |
| **Recharts**     | Data Visualization / Charts   | `3.8.1`    |
| **Axios**        | HTTP Client                   | `1.14.0`   |

### Backend

| Technology           | Purpose                       | Version    |
| :------------------- | :---------------------------- | :--------- |
| **FastAPI**          | Async REST API Framework      | `0.111.0`  |
| **Uvicorn**          | ASGI Server                   | `0.29.0`   |
| **Motor**            | Async MongoDB Driver          | `3.4.0`    |
| **LangChain**        | RAG Orchestration             | `≥0.2.26`  |
| **LangChain-Groq**   | Groq LLM Integration         | `≥0.1.9`   |
| **FAISS**            | Vector Similarity Search      | `latest`   |
| **ElevenLabs**       | Text-to-Speech Synthesis      | `1.2.0`    |
| **SlowAPI**          | Rate Limiting Middleware      | `0.1.9`    |
| **Pydantic**         | Data Validation & Schemas     | `≥2.7.4`   |
| **PyPDF2**           | PDF Text Extraction           | `3.0.1`    |

### Infrastructure

| Service          | Purpose                       |
| :--------------- | :---------------------------- |
| **MongoDB Atlas** | Cloud NoSQL Database          |
| **Vercel**       | Frontend Deployment (CDN/Edge)|
| **Render**       | Backend Deployment (Web Service)|
| **Groq Cloud**   | Ultra-fast LLM Inference      |
| **ElevenLabs**   | Voice Synthesis API           |
| **Sarvam AI**    | Fallback TTS Provider         |
| **Clerk**        | Identity & Auth Platform      |

---

## 🏗 Architecture

InterviewIQ follows a **split architecture** — the Next.js frontend is deployed independently on Vercel, while the FastAPI backend runs as a standalone service on Render.

```mermaid
graph TD
    subgraph Client ["🖥️ Frontend — Next.js on Vercel"]
        UI["App Router / Pages"]
        AuthC["Clerk Auth SDK"]
        State["Zustand Store"]
        Charts["Recharts Dashboards"]
    end

    subgraph Server ["⚙️ Backend — FastAPI on Render"]
        API["REST API Router"]
        AuthS["JWT Verification"]
        RAG["LangChain RAG Pipeline"]
        Session["Session Service"]
        Analytics["Analytics Engine"]
        RateLimit["SlowAPI Rate Limiter"]
    end

    subgraph VectorDB ["🔍 Vector Store"]
        FAISS["FAISS In-Memory Index"]
    end

    subgraph External ["☁️ External Services"]
        LLM["Groq AI — LLM Inference"]
        TTS1["ElevenLabs — Primary TTS"]
        TTS2["Sarvam AI — Fallback TTS"]
        DB[("MongoDB Atlas")]
        ClerkSvc["Clerk — Identity"]
    end

    UI <-->|REST / JSON| API
    UI <--> AuthC
    AuthC <-->|JWT| ClerkSvc
    API --> RateLimit
    API --> AuthS
    AuthS -->|Verify JWT| ClerkSvc
    API <--> RAG
    RAG <--> FAISS
    RAG <--> LLM
    API <--> Session
    Session <--> DB
    API <--> Analytics
    API -->|Primary| TTS1
    API -->|Fallback| TTS2
    Charts -.->|Visualize| State
```

---

## 🛣 Workflow / How It Works

### Core User Journey

1. **🔐 Authenticate** — User signs in via Clerk (Google, GitHub, or email/password)
2. **📄 Upload Resume** — User uploads a PDF resume through the dashboard
3. **🧬 Parse & Vectorize** — The backend extracts text via PyPDF2, parses structured data with Groq, and builds a FAISS vector index from resume chunks
4. **🎯 Configure Interview** — User selects target role, difficulty level (Internship → Principal), and interview type (Technical, Behavioral, Mixed, System Design)
5. **🤖 AI Strategy Generation** — Groq generates a personalized interview strategy based on resume + role
6. **❓ Question Loop** — AI generates context-aware questions; ElevenLabs speaks them aloud; user responds via voice or text
7. **📝 Real-Time Evaluation** — Each answer is scored across 5 dimensions with immediate quality feedback
8. **📊 Final Report** — After 10 questions, a comprehensive AI-generated report is produced with scores, strengths, weaknesses, and study recommendations
9. **📈 Track Progress** — Multi-session dashboards reveal improvement trends and AI coaching insights

```mermaid
sequenceDiagram
    actor U as 👤 User
    participant F as 🖥️ Frontend
    participant B as ⚙️ Backend
    participant V as 🔍 FAISS
    participant AI as 🤖 Groq LLM
    participant TTS as 🔊 ElevenLabs
    participant DB as 🗄️ MongoDB

    U->>F: Sign in via Clerk
    F->>B: POST /resume/upload (PDF)
    B->>AI: Parse resume → structured JSON
    B->>V: Embed & index resume chunks
    B->>DB: Store parsed resume
    B-->>F: ✅ Resume processed

    U->>F: Configure & start interview
    F->>B: POST /interview/start
    B->>AI: Generate strategy + first question
    B->>DB: Create session document
    B-->>F: Question #1

    loop For each question (up to 10)
        F->>B: POST /voice/synthesize
        B->>TTS: Convert text → audio
        TTS-->>B: Audio stream
        B-->>F: 🔊 Audio + text
        F-->>U: Play question audio

        U->>F: Submit answer (voice/text)
        F->>B: POST /interview/answer
        B->>V: Retrieve relevant context
        B->>AI: Evaluate answer (5 dimensions)
        B->>AI: Generate next question
        B->>DB: Update session state
        B-->>F: Score preview + next question
    end

    B->>AI: Generate comprehensive report
    B->>DB: Store report + analytics
    B-->>F: 📊 Final report + redirect
    F-->>U: Display detailed results
```

---

## 📂 Project Structure

```text
InterviewIQ/
├── backend/                          # 🐍 FastAPI Backend Application
│   ├── models/                       # Pydantic schemas & MongoDB document models
│   │   ├── evaluation.py             #   Answer evaluation data model
│   │   ├── session.py                #   Interview session document schema
│   │   └── user.py                   #   User profile model
│   ├── routes/                       # API endpoint definitions
│   │   ├── analytics.py              #   GET /analytics/progress — multi-session insights
│   │   ├── evaluation.py             #   POST /evaluate/answer — standalone evaluation
│   │   ├── interview.py              #   Interview lifecycle (start, answer, report)
│   │   ├── resume.py                 #   POST /resume/upload — PDF upload & parsing
│   │   └── voice.py                  #   POST /voice/synthesize — TTS with fallback
│   ├── services/                     # Core business logic layer
│   │   ├── analytics_service.py      #   Session scoring & multi-session trend analysis
│   │   ├── elevenlabs_service.py     #   ElevenLabs TTS API integration
│   │   ├── llm_service.py            #   Groq LLM orchestration (questions, eval, reports)
│   │   ├── rag_service.py            #   PDF extraction, FAISS indexing, context retrieval
│   │   ├── sarvam_service.py         #   Sarvam AI fallback TTS service
│   │   └── session_service.py        #   Session CRUD & state management
│   ├── prompts/                      # LLM system prompt templates
│   │   ├── answer_evaluator.py       #   Prompt for scoring candidate answers
│   │   ├── progress_analyzer.py      #   Prompt for multi-session coaching insights
│   │   ├── question_generator.py     #   Prompt for adaptive question generation
│   │   ├── report_generator.py       #   Prompt for final interview report
│   │   ├── resume_parser.py          #   Prompt for structured resume extraction
│   │   └── session_init.py           #   Prompt for interview strategy generation
│   ├── main.py                       # FastAPI app entry point, middleware, CORS
│   ├── config.py                     # Pydantic Settings — environment configuration
│   ├── database.py                   # Motor async MongoDB connection & indexes
│   ├── auth.py                       # Clerk JWT token verification dependency
│   └── requirements.txt              # Python dependencies
│
├── frontend/                         # ⚛️ Next.js 16 Frontend Application
│   ├── app/                          # App Router (pages, layouts, routing)
│   │   ├── (auth)/                   #   Clerk sign-in / sign-up pages
│   │   ├── dashboard/                #   Main dashboard — resume upload & session history
│   │   ├── interview/                #   Live interview session & report viewer
│   │   ├── progress/                 #   Multi-session analytics & progress charts
│   │   ├── layout.tsx                #   Root layout with Clerk provider
│   │   ├── page.tsx                  #   Landing page
│   │   └── globals.css               #   Global Tailwind styles & theme tokens
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                       #   Primitives: Button, Card, Badge
│   │   ├── dashboard/                #   ProgressChart, SessionCard
│   │   ├── interview/                #   AudioPlayer, VoiceRecorder, QuestionDisplay,
│   │   │                             #   InterviewerAvatar, CodeEditor, FeedbackToast,
│   │   │                             #   ConversationHistory, InterviewTimer, SilenceIndicator
│   │   └── report/                   #   ScoreCard, CategoryChart, QuestionBreakdown,
│   │                                 #   StudyRecommendations
│   ├── lib/                          # Utility & API layer
│   │   ├── api.ts                    #   Axios instance & typed API call functions
│   │   └── utils.ts                  #   Helper utilities (formatting, parsing)
│   ├── store/                        # Client-side state management
│   │   └── interviewStore.ts         #   Zustand store for interview session state
│   ├── types/                        # TypeScript type definitions
│   │   └── index.ts                  #   Shared interfaces (Session, Evaluation, Report)
│   ├── next.config.ts                # Next.js configuration (rewrites, headers)
│   ├── tailwind.config.ts            # Tailwind CSS theme customization
│   ├── tsconfig.json                 # TypeScript compiler options
│   └── package.json                  # Node.js dependencies & scripts
│
├── render.yaml                       # 🚀 Render Blueprint — backend deployment config
├── vercel.json                       # 🚀 Vercel config — frontend deployment settings
├── .env.example                      # 📋 Environment variable template
├── package.json                      # 📦 Root monorepo scripts
└── README.md                         # 📖 You are here
```

---

## 🏁 Getting Started

### Prerequisites

| Requirement    | Minimum Version | Purpose                           |
| :------------- | :-------------- | :-------------------------------- |
| **Node.js**    | `v18.0.0+`      | Frontend runtime                  |
| **Python**     | `v3.10+`        | Backend runtime                   |
| **MongoDB**    | `v6.0+`         | Database (local or Atlas)         |
| **Git**        | `v2.30+`        | Version control                   |

You will also need API keys from the following services:

| Service        | Sign Up Link                                    | Key(s) Needed                |
| :------------- | :---------------------------------------------- | :--------------------------- |
| **Clerk**      | [clerk.com](https://clerk.com)                  | Publishable key, Secret key  |
| **Groq**       | [console.groq.com](https://console.groq.com)    | API key                      |
| **ElevenLabs** | [elevenlabs.io](https://elevenlabs.io)           | API key, Voice ID            |
| **Sarvam AI**  | [sarvam.ai](https://www.sarvam.ai)              | API key _(optional fallback)_|

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/amansingh4012/InterviewIQ.git
cd InterviewIQ
```

**2. Install frontend dependencies**

```bash
cd frontend
npm install
```

**3. Set up the backend**

```bash
cd ../backend
python -m venv venv

# Activate the virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
.\venv\Scripts\activate

pip install -r requirements.txt
```

### Environment Variables

Create the following `.env` files from the provided template:

```bash
# Copy the example file
cp .env.example .env
```

#### Backend (`backend/.env`)

| Variable                  | Description                                  | Example                                      |
| :------------------------ | :------------------------------------------- | :------------------------------------------- |
| `GROQ_API_KEY`            | Groq Cloud API key for LLM inference         | `gsk_aBcDeFgHiJkLmNoPqRsT...`               |
| `MONGODB_URL`             | MongoDB connection string                    | `mongodb+srv://user:pass@cluster.mongodb.net`|
| `MONGODB_DB_NAME`         | Database name                                | `interviewiq`                                |
| `CLERK_SECRET_KEY`        | Clerk backend secret key                     | `sk_test_...`                                |
| `CLERK_JWT_PUBLIC_KEY`    | Clerk JWT public key (PEM format)            | `-----BEGIN PUBLIC KEY-----...`              |
| `ELEVENLABS_API_KEY`      | ElevenLabs API key for voice synthesis        | `sk_...`                                     |
| `ELEVENLABS_VOICE_ID`     | ElevenLabs voice actor ID                    | `21m00Tcm4TlvDq8ikWAM`                      |
| `SARVAM_API_KEY`          | Sarvam AI key _(optional)_                   | `sarvam_...`                                 |
| `ENVIRONMENT`             | Runtime environment                          | `development` or `production`                |
| `FRONTEND_URL`            | Frontend origin for CORS                     | `http://localhost:3000`                      |

#### Frontend (`frontend/.env.local`)

| Variable                             | Description                        | Example                                      |
| :----------------------------------- | :--------------------------------- | :------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  | Clerk publishable key              | `pk_test_...`                                |
| `NEXT_PUBLIC_API_URL`                | Backend API base URL               | `http://localhost:8000`                      |

### Running Locally

Open **two terminal windows** and run:

**Terminal 1 — Backend**

```bash
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

Or use the root-level convenience scripts:

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

The app will be available at:

| Service   | URL                          |
| :-------- | :--------------------------- |
| Frontend  | http://localhost:3000         |
| Backend   | http://localhost:8000         |
| API Docs  | http://localhost:8000/docs    |

### Running with Docker

> 🚧 **Coming Soon** — A `docker-compose.yml` for one-command local setup is on the roadmap. In the meantime, follow the manual setup above.

---

## 🔌 API Reference

All endpoints (except health checks) require a valid **Clerk JWT** in the `Authorization: Bearer <token>` header.

### Health

| Method | Endpoint       | Description             | Auth |
| :----- | :------------- | :---------------------- | :--- |
| `GET`  | `/health`      | Server health check     | ❌   |
| `GET`  | `/api/health`  | API health check        | ❌   |

### Resume

| Method | Endpoint          | Description                                    | Auth |
| :----- | :---------------- | :--------------------------------------------- | :--- |
| `POST` | `/resume/upload`  | Upload PDF resume → parse → vectorize → store  | ✅   |

### Interview

| Method | Endpoint                       | Description                                        | Auth |
| :----- | :----------------------------- | :------------------------------------------------- | :--- |
| `POST` | `/interview/start`             | Start a new interview session                      | ✅   |
| `POST` | `/interview/answer`            | Submit an answer, receive eval + next question     | ✅   |
| `GET`  | `/interview/session/{id}`      | Retrieve active session state (for page recovery)  | ✅   |
| `GET`  | `/interview/report/{id}`       | Get the comprehensive post-interview report        | ✅   |
| `GET`  | `/interview/sessions`          | List all sessions for current user                 | ✅   |

### Evaluation

| Method | Endpoint           | Description                            | Auth |
| :----- | :----------------- | :------------------------------------- | :--- |
| `POST` | `/evaluate/answer` | Standalone answer evaluation endpoint  | ✅   |

### Voice

| Method | Endpoint            | Description                                      | Auth |
| :----- | :------------------ | :----------------------------------------------- | :--- |
| `POST` | `/voice/synthesize` | Convert text → speech (ElevenLabs + Sarvam fallback) | ✅   |

### Analytics

| Method | Endpoint              | Description                                         | Auth |
| :----- | :-------------------- | :-------------------------------------------------- | :--- |
| `GET`  | `/analytics/progress` | Multi-session progress analytics with AI coaching    | ✅   |

<details>
<summary><strong>📋 Request / Response Examples</strong></summary>

#### Start Interview

```json
// POST /interview/start
{
  "resume_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "Senior Frontend Engineer",
  "interview_type": "Technical",
  "difficulty": "Senior"
}
```

```json
// Response
{
  "session_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "question": "Looking at your experience with React and Next.js, can you walk me through how you would architect a complex form with server-side validation?",
  "question_number": 1,
  "status": "active"
}
```

#### Voice Synthesis

```json
// POST /voice/synthesize
{
  "text": "Tell me about a time you had to debug a critical production issue."
}
```

```
// Response: audio/mpeg binary stream
```

</details>

---

## 📸 Screenshots / Demo

> 📷 _Screenshots coming soon. Stay tuned for a visual walkthrough of the platform._

<!-- Add screenshots when available -->
<!--
| Dashboard | Interview Session | Report |
|:---:|:---:|:---:|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Interview](docs/screenshots/interview.png) | ![Report](docs/screenshots/report.png) |
-->

---

## 🚢 Deployment Guide

InterviewIQ uses a **split deployment** strategy:

| Component | Platform | Config File    |
| :-------- | :------- | :------------- |
| Frontend  | Vercel   | `vercel.json`  |
| Backend   | Render   | `render.yaml`  |

### Frontend → Vercel

1. **Import project** on [vercel.com](https://vercel.com/new)
2. Set **Root Directory** to `frontend`
3. Framework preset will auto-detect **Next.js**
4. Add environment variables:

   ```text
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
   ```

5. Deploy — Vercel handles builds, CDN, and edge routing automatically

### Backend → Render

1. **Connect repository** on [render.com](https://render.com)
2. Render auto-detects `render.yaml` Blueprint:

   ```yaml
   # Key settings from render.yaml
   runtime: python
   rootDir: backend
   buildCommand: pip install -r requirements.txt
   startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. Set environment variables in the Render dashboard:

   ```text
   GROQ_API_KEY=gsk_...
   MONGODB_URL=mongodb+srv://...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
   ELEVENLABS_API_KEY=sk_...
   ELEVENLABS_VOICE_ID=...
   SARVAM_API_KEY=...
   FRONTEND_URL=https://your-app.vercel.app
   ENVIRONMENT=production
   ```

4. Deploy — Render monitors the `backend/` directory for changes

### Post-Deployment Checklist

- [ ] Verify `/health` endpoint returns `{"status": "ok"}`
- [ ] Confirm CORS allows your Vercel domain
- [ ] Test Clerk authentication flow end-to-end
- [ ] Run a full interview cycle to verify Groq + ElevenLabs connectivity
- [ ] Check MongoDB Atlas IP whitelist includes Render IPs

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. **Fork** the repository
2. **Create** your feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes with a descriptive message
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **Push** to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open** a Pull Request

> 💡 **Tip:** Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages. Run the linter before submitting:
> ```bash
> cd frontend && npm run lint
> ```

---

## 📜 License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 📫 Contact / Author

<div>

**Aman Kumar Singh**

[![GitHub](https://img.shields.io/badge/GitHub-@amansingh4012-181717?style=for-the-badge&logo=github)](https://github.com/amansingh4012)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Aman_Kumar_Singh-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/aman-kumar-singh-806176251/)
[![Email](https://img.shields.io/badge/Email-amansingh.as9170@gmail.com-EA4335?style=for-the-badge&logo=gmail)](mailto:amansingh.as9170@gmail.com)

</div>

---

<div align="center">

**⭐ If InterviewIQ helped you prepare for interviews, give it a star! ⭐**

<a href="#-interviewiq">⬆️ Back to Top</a>

</div>
