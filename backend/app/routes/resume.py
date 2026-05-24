from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.pdf_parser import extract_text_from_pdf
from app.services.gemini_service import analyze_resume_with_ai, rewrite_bullet_with_ai
from pydantic import BaseModel

router = APIRouter(prefix="/api/resume", tags=["Resume"])


@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form("")
):
    """
    Accepts a PDF resume file and an optional job description.
    Returns AI-powered ATS analysis including score, keywords, and feedback.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        file_bytes = await file.read()
        parsed_text = extract_text_from_pdf(file_bytes)

        if not parsed_text or len(parsed_text.strip()) < 50:
            raise HTTPException(
                status_code=422,
                detail="Could not extract enough text from the PDF. Please ensure it is not a scanned image."
            )

        # Run AI analysis
        analysis = await analyze_resume_with_ai(parsed_text, job_description)

        return {
            "success": True,
            "filename": file.filename,
            "word_count": len(parsed_text.split()),
            "ats": analysis.get("ats_score", 0),
            "keywords": analysis.get("found_keywords", []),
            "missing": analysis.get("missing_keywords", []),
            "section_scores": analysis.get("section_scores", {}),
            "feedback": analysis.get("feedback", []),
            "action_verbs_count": analysis.get("strong_action_verbs_count", 0),
            "metrics_count": analysis.get("metrics_usage_count", 0),
            "fallback_mode": analysis.get("fallback_mode", False),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")


class RewriteRequest(BaseModel):
    bullet: str
    job_description: str


@router.post("/rewrite")
async def rewrite_bullet(request: RewriteRequest):
    """
    Rewrites a single resume bullet point to better match a target job description.
    """
    if not request.bullet.strip():
        raise HTTPException(status_code=400, detail="Bullet text cannot be empty.")

    rewritten = await rewrite_bullet_with_ai(request.bullet, request.job_description)

    return {
        "success": True,
        "original": request.bullet,
        "rewritten": rewritten,
    }
