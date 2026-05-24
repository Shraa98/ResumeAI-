# Implementation Plan: AI Resume + Interview Preparation Platform

This plan is optimized for a **solo developer** to build a high-end, freelance-ready SaaS platform. It prioritizes speed, visual excellence, and a robust Python-based backend using **FastAPI**, **Pydantic**, and **Uvicorn**, paired with **React (Vite)** for the frontend and **Supabase** for managed services.

All tasks are tracked in Linear under the **Resume Builder** project.

---

## 1. Technical Stack (SaaS-Grade & Python-Backend Optimized)

Based on architectural efficiency, developer velocity, and SaaS costs, the recommended tech stack includes:

*   **Supabase Vector (pgvector) over Pinecone:** Rather than syncing data between Postgres (user metadata, profiles, files) and Pinecone, we use Supabase’s built-in `pgvector`. This keeps all data in one place, eliminates complex synchronization pipelines, simplifies user auth row-level security (RLS) filters, and is highly cost-effective for user-scoped document RAG.
*   **ElevenLabs + OpenAI Whisper:** We combine both audio engines. **ElevenLabs** serves as the **Text-to-Speech (TTS)** engine to generate the AI interviewer's voice (realistic, expressive, human-like voice synthesis), while **OpenAI Whisper** serves as the **Speech-to-Text (STT)** engine to transcribe user answers accurately.
*   **Hybrid AI Model Strategy:** Rather than relying solely on Claude 3.5 Sonnet:
    *   **Claude 3.5 Sonnet** is used for resume scoring, tailoring, and ATS parsing due to its unmatched capabilities in professional writing, structure, and reasoning.
    *   **GPT-4o-mini** (or **Gemini 1.5 Flash**) is used for the interactive mock interview loops because they are extremely fast (low latency) and cheap, ensuring real-time response capability during speech conversations.

### Stack Breakdown

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React (Vite + TypeScript) | Fast development, hot module reloading, and clean SPA architecture. |
| **Styling** | Tailwind CSS + shadcn/ui | Modern, consistent design system and UI components out of the box. |
| **Charts/Data** | **Tremor / Recharts** | Pro-level analytics, skill heatmaps, and score trackers. |
| **Backend API** | **FastAPI + Pydantic + Uvicorn** | High-performance Python backend. Handles all AI processing, PDF parsing, business logic, and API endpoints. |
| **Database/Auth** | **Supabase (+ Vector)** | Replaces complex manual setups. Handles PostgreSQL, Auth, File Storage, and pgvector for RAG. |
| **AI Intelligence**| **Claude 3.5 Sonnet + GPT-4o-mini (Hybrid)** | Sonnet for quality-critical resume writes; GPT-4o-mini for fast, low-cost interview loops. |
| **TTS Engine** | **ElevenLabs** | Ultra-realistic voice synthesis for the AI interviewer. |
| **STT Engine** | **OpenAI Whisper** | Precise voice transcription for mock interview analysis. |
| **Caching** | **PostgreSQL (Supabase Cache)** | Cache API responses to minimize LLM costs and latency. |

---

## 2. Proposed Database Schema (Supabase/PostgreSQL)

- **`users` Table**: Profiles, target roles, experience level, and user metadata.
- **`resumes` Table**: PDF file URLs, raw text, and parsed JSON structures.
- **`prompts` Table**: Key, template content, and versioning for system instructions.
- **`ai_cache` Table**: Key (hash of input), cached JSON response, and TTL to prevent duplicate API hits.
- **`analyses` Table**: ATS scores, missing keywords, section evaluations, and action verb check results.
- **`interviews` Table**: Roles, session status, transcribing results, and STAR scoring data.
- **`company_profiles` Table**: Document embeddings with vector type (`pgvector`) for RAG (e.g. Google L&S, Amazon Leadership Principles).
- **`events` Table**: Analytics tracking (`upload_resume`, `start_mock`, etc.).

---

## 3. Detailed Development Phases & Linear Tickets

### Phase 1: Foundation & "Elite" Analytics Dashboard UI
*Focus: Setting up both repositories and building the visual "Wow" factor.*

*   **[PRO-9] Initialize Frontend (React/Vite) & Backend (FastAPI)**: React (Vite) initialized with Tailwind CSS, TypeScript, and shadcn/ui. FastAPI project structured with Pydantic schemas, routes, configuration, and Uvicorn runtime.
*   **[PRO-11] Dashboard UI: Elite Analytics Interface**: High-end charts (ATS trends, skill heatmaps, confidence gauges) using Tremor/Recharts.
*   **[PRO-10] Database & Auth Setup**: Configure Supabase client on both Frontend (React) and Backend (FastAPI). Set up database schema and the `prompts` table in Supabase so prompts are never hardcoded.

### Phase 2: ATS Resume Analysis Engine (FastAPI + NLP)
*Focus: Deep AI parsing and evaluation.*

*   **[PRO-12] Parser & Scorer: Build PDF Parser & ATS Engine**: FastAPI endpoints reading file uploads with `PyMuPDF`/`pdfplumber`. Natural Language Processing using `spaCy` to extract skills, evaluate metrics usage (quantifiable achievements), and count strong action verbs. Check keywords against Job Description and integrate Supabase `ai_cache` table to save cost.

### Phase 3: Resume Editor & AI Coach Memory
*Focus: Helping the user upgrade their resume.*

*   **[PRO-13] AI Bullet Tailoring: Integrate Claude 3.5 Sonnet API**: Claude 3.5 Sonnet API endpoint in FastAPI to rewrite specific resume bullets based on a target Job Description.
*   **[PRO-14] Document Builders: Browser PDF Engine & Cover Letter Generator**: Render beautiful, clean PDFs in the browser using `react-pdf`. Create dynamic cover letters derived from the parsed resume and JD.
*   **[PRO-15] Career Memory: Database Sync for AI Coaching Retention**: AI stores user mistakes or weak areas (e.g., lack of leadership metrics) in the database to refer back to them during mock interviews.

### Phase 4: Company-Specific RAG & Voice Mock Interview
*Focus: High-impact interactive audio features with ElevenLabs and Whisper.*

*   **[PRO-16] Contextual RAG: Supabase Vector (pgvector) Company Profiles**: Store company-specific interview prep context and query pgvector to generate accurate interview sessions. Sync questions with the user's resume history.
*   **[PRO-17] Voice Pipeline: ElevenLabs TTS & OpenAI Whisper STT Integration**: Integrate ElevenLabs API in FastAPI to generate the AI interviewer's voice. Use browser MediaRecorder API to record user answers, sending them to FastAPI to be transcribed using OpenAI Whisper.
*   **[PRO-18] Interview Loop: Low-Latency GPT-4o-mini & STAR Evaluation**: Construct dynamic mock interview conversation loops using low-latency GPT-4o-mini. Evaluate answers using the STAR framework, tracking filler words, structure completeness, and metrics.

### Phase 5: Recruiter Mode & SaaS Limits
*Focus: Scalability and production-readiness.*

*   **[PRO-19] Production Release: Recruiter Ranker & SaaS Limits**: Recruiter portal to upload multiple resumes and rank candidates against a JD. Log events for analytics and rate-limit free tier mock interviews and scans.

---

## 4. Verification Plan

### Automated Tests
- **FastAPI Endpoints**: Unit tests using `pytest` and `HTTPClient` to verify parsing, caching, database reads, and ElevenLabs/Whisper integration responses.
- **React UI**: Integration testing for files upload, dashboard navigation, and authentication states.

### Manual Verification
- **ATS Parsing Integrity**: Upload 5 different resumes (different layouts) and verify text layout extraction.
- **Audio Flow Integrity**: Verify TTS voice plays automatically upon receiving a new question, and STT successfully transcribes a 15-second spoken user answer.
- **RAG Relevance**: Query target companies (e.g. "Google Frontend Engineer") and verify generated questions match their standard styles.
