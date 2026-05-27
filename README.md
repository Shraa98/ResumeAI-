<div align="center">

<img src="https://img.shields.io/badge/Status-In%20Development-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python&logoColor=white" />
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/FastAPI-0.136-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
<img src="https://img.shields.io/badge/Supabase-Powered-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />

# 🎯 ResumeAI — AI Resume & Interview Preparation Platform

**Land your dream job with AI-powered resume analysis, intelligent ATS scoring, and voice-based mock interviews.**

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Project Structure](#-project-structure) · [API Reference](#-api-reference) · [Roadmap](#-roadmap)

</div>

---

## ✨ Features

### 📄 AI Resume Analysis Engine
- **ATS Score** — Real percentage match against any job description with section-by-section breakdown
- **Keyword Gap Analysis** — Instantly see which JD keywords are missing from your resume
- **Specific Feedback** — AI references your *actual* bullet points by name and rewrites them with stronger action verbs and quantified outcomes
- **Multi-layout PDF Parsing** — Handles any resume format via `PyMuPDF` + `pdfplumber`

### ✍️ Smart Resume Editor
- **AI Bullet Rewriter** — 3 rewrite options (Conservative / Balanced / Aggressive) for every bullet point
- **In-browser PDF Export** — Generate clean, recruiter-ready PDFs directly in the browser via `react-pdf`
- **Cover Letter Generator** — Targeted letters built from your resume + JD — no templates, no filler
- **Career Memory** — AI tracks your weak areas across sessions and surfaces them in mock interviews

### 🎙️ Voice Mock Interview
- **Realistic AI Interviewer** — ElevenLabs TTS generates a human-like interviewer voice
- **Speech-to-Text Transcription** — OpenAI Whisper captures and transcribes your answers accurately
- **STAR Framework Scoring** — Every answer is evaluated on Situation / Task / Action / Result
- **Filler Word Detection** — Tracks "um", "like", "basically" in real time with coaching feedback
- **Company-Specific Questions** — RAG-powered questions tailored to Google, Amazon, Microsoft, and more

### 📊 Elite Analytics Dashboard
- ATS score trends over time
- Skill heatmaps vs. target role requirements
- Confidence score progression across mock interview sessions
- Keyword coverage radar charts

### 👔 Recruiter Mode *(Phase 5)*
- Upload multiple resumes and rank candidates against a single JD
- Bulk ATS scoring with comparative breakdowns

---

## 🛠 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + Vite + TypeScript | Fast dev, hot reload, type safety |
| **Styling** | Tailwind CSS + shadcn/ui | Production-grade design system |
| **Charts** | Recharts | ATS trends, skill heatmaps, score gauges |
| **Backend** | FastAPI + Pydantic + Uvicorn | High-performance async Python API |
| **Database / Auth** | Supabase (PostgreSQL + pgvector) | Auth, storage, and vector RAG in one place |
| **AI — Resume** | Gemini 1.5 Flash | Fast, cost-effective scoring and bullet rewrites |
| **AI — Interview** | GPT-4o-mini / Gemini Flash | Low-latency real-time conversation loops |
| **TTS** | ElevenLabs | Ultra-realistic AI interviewer voice |
| **STT** | OpenAI Whisper | Accurate speech transcription for mock answers |
| **Vector Search** | Supabase pgvector | Company-specific RAG (no external Pinecone needed) |
| **PDF Parsing** | PyMuPDF + pdfplumber | Robust multi-layout resume extraction |
| **State Management** | Redux Toolkit | Predictable global state for session data |

---

## 📁 Project Structure

```
ai-resume-project/
│
├── backend/                        # FastAPI Python backend
│   └── app/
│       ├── main.py                 # App entry point, CORS, router registration
│       ├── config.py               # Environment variables via Pydantic Settings
│       │
│       ├── prompts/                # ✦ All AI prompts (never hardcoded in services)
│       │   ├── __init__.py         # Clean public API for all prompt builders
│       │   ├── resume_analysis.py  # ATS scoring + section evaluation prompt
│       │   ├── bullet_rewrite.py   # 3-option bullet enhancement prompt
│       │   ├── cover_letter.py     # Targeted cover letter generation
│       │   └── interview.py        # Question gen + STAR eval + session debrief
│       │
│       ├── routes/                 # API route handlers
│       │   ├── resume.py           # /upload, /analyze, /rewrite-bullet
│       │   ├── interview.py        # /session/start, /session/evaluate, /session/debrief
│       │   └── auth.py             # Supabase auth passthrough
│       │
│       └── services/               # Business logic layer
│           ├── gemini_service.py   # Gemini API calls (analysis + rewrites)
│           ├── pdf_parser.py       # PyMuPDF + pdfplumber extraction
│           ├── tts_service.py      # ElevenLabs TTS integration
│           ├── stt_service.py      # OpenAI Whisper transcription
│           └── supabase_service.py # DB reads/writes + pgvector queries
│
├── frontend/                       # React + Vite frontend
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx       # Analytics overview
│       │   ├── ResumeUpload.tsx    # Upload + ATS analysis view
│       │   ├── ResumeEditor.tsx    # Bullet editor + PDF export
│       │   └── MockInterview.tsx   # Voice interview session
│       │
│       ├── components/             # Reusable UI components
│       └── lib/                    # API client, Supabase client, utilities
│
└── supabase/
    └── migrations/                 # SQL schema migrations
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Supabase](https://supabase.com) project
- API keys for Gemini, ElevenLabs, and OpenAI

### 1. Clone & Install

```bash
git clone https://github.com/your-username/ai-resume-project.git
cd ai-resume-project
```

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# AI Models
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key

# Voice
ELEVENLABS_API_KEY=your-elevenlabs-key
ELEVENLABS_VOICE_ID=your-chosen-voice-id

# App
SECRET_KEY=your-secret-key
ENVIRONMENT=development
```

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Set Up the Database

Run the migrations in your Supabase SQL editor (files in `supabase/migrations/`), or use the Supabase CLI:

```bash
supabase db push
```

### 4. Run the Development Servers

**Backend** (from `/backend`):
```bash
uvicorn app.main:app --reload --port 8000
```

**Frontend** (from `/frontend`):
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the backend API docs are at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `users` | Profiles, target roles, experience level |
| `resumes` | PDF URLs, extracted text, parsed JSON |
| `analyses` | ATS scores, keyword gaps, section scores |
| `interviews` | Session metadata, transcripts, STAR scores |
| `company_profiles` | pgvector embeddings for company-specific RAG |
| `prompts` | Versioned system prompts (never hardcoded) |
| `ai_cache` | Hashed input → cached AI response (saves cost) |
| `events` | Analytics tracking for feature usage |

---

## 📡 API Reference

### Resume Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/resume/upload` | Upload a PDF resume, returns extracted text |
| `POST` | `/resume/analyze` | Full ATS analysis against a JD |
| `POST` | `/resume/rewrite-bullet` | Rewrite a single bullet (3 options returned) |
| `POST` | `/resume/cover-letter` | Generate a targeted cover letter |

### Interview Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/interview/session/start` | Generate tailored interview questions |
| `POST` | `/interview/session/evaluate` | Score a transcribed answer (STAR) |
| `POST` | `/interview/session/debrief` | Full session coaching report |
| `POST` | `/interview/tts` | Convert AI question text to ElevenLabs audio |
| `POST` | `/interview/stt` | Transcribe recorded answer via Whisper |

---

## 🗺️ Roadmap

| Phase | Status | Features |
|---|---|---|
| **Phase 1** | ✅ Complete | Project setup, analytics dashboard UI |
| **Phase 2** | ✅ Complete | PDF parsing, ATS scoring engine, keyword analysis |
| **Phase 3** | 🔄 In Progress | AI bullet rewriter, PDF export, cover letter generator |
| **Phase 4** | 🔜 Next | Voice mock interview, STAR evaluation, company RAG |
| **Phase 5** | 📋 Planned | Recruiter mode, SaaS limits, rate limiting, billing |

---

## 🧪 Testing

**Backend unit tests:**
```bash
cd backend
pytest tests/ -v
```

**Manual verification checklist:**
- [ ] Upload 5 resumes with different layouts — verify text extraction accuracy
- [ ] Run ATS analysis on a fresh-grad resume — confirm `work_experience` score is 0
- [ ] Verify TTS audio plays automatically when a new interview question arrives
- [ ] Speak a 15-second answer and confirm Whisper transcribes it correctly
- [ ] Query "Google Frontend Engineer" and verify generated questions match Google's style

---

## 🤝 Contributing

This is a solo project currently in active development. Feedback and suggestions are welcome — open an issue or reach out directly.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ using FastAPI, React, and a lot of AI

</div>