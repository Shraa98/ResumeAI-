import google.generativeai as genai
import json
import re
from app.config import settings


def get_gemini_model():
    """
    Configures and returns a Gemini 1.5 Flash model instance.
    Returns None if the API key is not configured.
    """
    if not settings.GEMINI_API_KEY:
        return None
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel("gemini-1.5-flash")


async def analyze_resume_with_ai(resume_text: str, job_description: str) -> dict:
    """
    Uses Gemini to analyze a resume against a job description.
    Returns ATS score, found keywords, missing keywords, and feedback.
    Falls back to heuristic analysis if API key is missing.
    """
    model = get_gemini_model()

    if not model:
        return _fallback_analysis(resume_text, job_description)

    prompt = f"""You are an expert ATS (Applicant Tracking System) resume analyst. 
Analyze the following resume against the job description and return ONLY a valid JSON response.

RESUME:
{resume_text[:4000]}

JOB DESCRIPTION:
{job_description[:2000]}

Return EXACTLY this JSON format, no other text:
{{
    "ats_score": <integer 0-100>,
    "found_keywords": [<list of keywords from the JD that ARE present in the resume>],
    "missing_keywords": [<list of important keywords from the JD that are MISSING from the resume>],
    "section_scores": {{
        "contact_info": <integer 0-100>,
        "work_experience": <integer 0-100>,
        "skills": <integer 0-100>,
        "education": <integer 0-100>,
        "formatting": <integer 0-100>
    }},
    "feedback": [<list of 3-5 actionable improvement suggestions>],
    "strong_action_verbs_count": <integer>,
    "metrics_usage_count": <integer>
}}"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Extract JSON from potential markdown code blocks
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
        if json_match:
            text = json_match.group(1)

        result = json.loads(text)
        return result
    except Exception as e:
        print(f"Gemini API error: {e}")
        return _fallback_analysis(resume_text, job_description)


async def rewrite_bullet_with_ai(bullet_text: str, job_description: str) -> str:
    """
    Uses Gemini to rewrite a single resume bullet point to better match a JD.
    """
    model = get_gemini_model()

    if not model:
        return f"[AI Enhanced] {bullet_text}"

    prompt = f"""You are an expert resume writer. Rewrite the following resume bullet point 
to better match the target job description. Make it more impactful with strong action verbs 
and quantifiable metrics. Keep it concise (1-2 lines max).

ORIGINAL BULLET: {bullet_text}
TARGET JOB DESCRIPTION: {job_description[:1000]}

Return ONLY the rewritten bullet point, no other text."""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini rewrite error: {e}")
        return f"[AI Enhanced] {bullet_text}"


def _fallback_analysis(resume_text: str, job_description: str) -> dict:
    """
    Heuristic-based analysis when AI is unavailable.
    """
    resume_lower = resume_text.lower()
    jd_lower = job_description.lower() if job_description else ""

    # Common tech keywords to check
    common_keywords = [
        "python", "javascript", "react", "typescript", "sql", "aws", "docker",
        "kubernetes", "git", "agile", "leadership", "communication", "java",
        "node.js", "fastapi", "django", "flask", "mongodb", "postgresql",
        "graphql", "rest", "api", "ci/cd", "machine learning", "data analysis",
        "project management", "scrum", "team lead", "frontend", "backend",
        "full stack", "cloud", "microservices", "testing", "html", "css"
    ]

    # Extract JD-specific keywords
    jd_keywords = [kw for kw in common_keywords if kw in jd_lower] if jd_lower else common_keywords[:15]

    found = [kw for kw in jd_keywords if kw in resume_lower]
    missing = [kw for kw in jd_keywords if kw not in resume_lower]

    # Heuristic score
    word_count = len(resume_text.split())
    keyword_ratio = len(found) / max(len(jd_keywords), 1)
    length_score = min(25, max(0, (word_count - 100) / 20))
    ats_score = int(min(95, max(35, keyword_ratio * 60 + length_score + 15)))

    # Count action verbs
    action_verbs = ["led", "managed", "developed", "created", "implemented", "designed",
                    "optimized", "delivered", "achieved", "improved", "launched", "built",
                    "established", "drove", "increased", "reduced", "streamlined"]
    verb_count = sum(1 for v in action_verbs if v in resume_lower)

    # Count metrics (numbers with %, $, or x)
    import re
    metrics = re.findall(r'\d+[\%\$xX]|\$\d+|\d+\s*(?:percent|million|thousand|users|clients)', resume_text)

    return {
        "ats_score": ats_score,
        "found_keywords": found[:10],
        "missing_keywords": missing[:8],
        "section_scores": {
            "contact_info": 80,
            "work_experience": min(90, ats_score + 5),
            "skills": min(95, int(keyword_ratio * 100)),
            "education": 75,
            "formatting": 70
        },
        "feedback": [
            "Add more quantifiable metrics to your bullet points (e.g., 'increased revenue by 20%').",
            f"You are missing {len(missing)} important keywords from the job description.",
            "Use stronger action verbs at the start of each bullet point.",
            "Ensure your resume is formatted in a single-column layout for ATS readability.",
            "Add a professional summary section tailored to this specific role."
        ],
        "strong_action_verbs_count": verb_count,
        "metrics_usage_count": len(metrics)
    }
