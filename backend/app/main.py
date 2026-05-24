from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes.resume import router as resume_router

app = FastAPI(title="ResumeAI API", version="1.0.0")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(resume_router)

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "ResumeAI API"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
