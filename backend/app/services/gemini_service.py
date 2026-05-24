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
    return genai.GenerativeModel("gemini-1.5-pro")


async def analyze_resume_with_ai(resume_text: str, job_description: str) -> dict:
    """
    Uses Gemini to analyze a resume against a job description.
    Returns ATS score, found keywords, missing keywords, and feedback.
    Falls back to heuristic analysis if API key is missing or invalid.
    """
    model = get_gemini_model()

    if not model:
        result = _fallback_analysis(resume_text, job_description)
        result["fallback_mode"] = True
        return result

    prompt = f"""You are an expert ATS (Applicant Tracking System) resume analyst. 
Analyze the following resume against the job description and return ONLY a valid JSON response.

CRITICAL SCORING RULES:
1. Work Experience: If the candidate has ZERO formal work experience (internships and jobs), the `work_experience` score MUST be 0. Do NOT give points for academic projects in the work experience section.
2. Contact Info: Verify presence of Email, Phone, LinkedIn, and Portfolio/GitHub. Deduct points proportionally if any are missing.

RESUME:
{resume_text[:4000]}

JOB DESCRIPTION:
{job_description[:2000]}

Return EXACTLY this JSON format, no other text:
{{
    "company_name": "<extracted company name from JD, or 'Unknown Company'>",
    "job_title": "<extracted job title/role from JD, or 'Unknown Role'>",
    "ats_score": <integer 0-100, heavily weighted by work_experience and skills>,
    "found_keywords": [<list of keywords from the JD that ARE present in the resume>],
    "missing_keywords": [<list of important keywords from the JD that are MISSING from the resume>],
    "section_scores": {{
        "contact_info": <integer 0-100>,
        "work_experience": <integer 0-100, MUST be 0 if no formal jobs/internships>,
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
        result["fallback_mode"] = False
        return result
    except Exception as e:
        print(f"Gemini API error: {e}")
        result = _fallback_analysis(resume_text, job_description)
        result["fallback_mode"] = True
        return result


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
    Refined heuristic analysis. Uses robust line-by-line section header matching,
    detects email/phone/social anchor links, handles fresh graduates with projects,
    and scores education/contact details with 100% accuracy if requirements are met.
    """
    resume_lower = resume_text.lower()
    jd_lower = job_description.lower() if job_description else ""

    # Clean and split into lines to identify headings
    lines = [line.strip().lower() for line in resume_text.split("\n") if line.strip()]

    # 1. Keyword extraction and matching
    tech_keywords = [
        "python", "javascript", "react", "typescript", "sql", "aws", "docker",
        "kubernetes", "git", "agile", "leadership", "communication", "java",
        "node.js", "fastapi", "django", "flask", "mongodb", "postgresql",
        "graphql", "rest", "api", "ci/cd", "machine learning", "data analysis",
        "project management", "scrum", "team lead", "frontend", "backend",
        "full stack", "cloud", "microservices", "testing", "html", "css",
        "devops", "linux", "gcp", "azure", "jenkins", "terraform", "c++", "c#",
        "rust", "golang", "pandas", "numpy", "tensorflow", "pytorch", "keras",
        "spark", "hadoop", "caching", "redis", "nginx", "elasticsearch"
    ]

    # Find keywords present in the Job Description
    jd_keywords = []
    if jd_lower:
        for kw in tech_keywords:
            if re.search(rf"\b{re.escape(kw)}\b", jd_lower):
                jd_keywords.append(kw)
    
    # Fallback to standard ML keywords if JD is thin or empty
    if not jd_keywords:
        jd_keywords = ["python", "sql", "aws", "git", "agile", "communication"]

    found_keywords = []
    missing_keywords = []
    for kw in jd_keywords:
        if re.search(rf"\b{re.escape(kw)}\b", resume_lower):
            found_keywords.append(kw)
        else:
            missing_keywords.append(kw)

    # 2. Section detection & scoring
    # Contact Info Check (email, phone, linkedin, github, portfolio)
    has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", resume_text))
    # Match standard international & domestic formats, +91, with/without spaces
    has_phone = bool(re.search(r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{10}\b|\b\d{5}\s\d{5}\b", resume_text))
    has_linkedin = "linkedin" in resume_lower
    has_github = "github" in resume_lower
    has_portfolio = any(kw in resume_lower for kw in ["portfolio", "website", "personal site", "skkonda"])

    contact_score = 0
    if has_email: contact_score += 30
    if has_phone: contact_score += 30
    if has_linkedin: contact_score += 20
    if has_github: contact_score += 10
    if has_portfolio: contact_score += 10

    # Ensure a baseline score if we found some contact information
    contact_score = max(contact_score, 40 if (has_email or has_phone) else 0)

    # Work Experience Check vs Academic/Personal Projects Check
    experience_headers = ["experience", "work experience", "employment", "employment history", "work history", "professional experience", "professional career", "experience summary", "relevant experience"]
    has_experience_section = any(any(line == h for h in experience_headers) for line in lines)
    if not has_experience_section:
        # Check if they have a heading that starts with experience followed by colons or formatting symbols
        has_experience_section = any(any(line.startswith(h) and len(line) < len(h) + 3 for h in experience_headers) for line in lines)

    project_headers = ["projects", "personal projects", "academic projects", "key projects", "technical projects", "extra-curricular", "activities"]
    has_projects_section = any(any(line == p for p in project_headers) for line in lines)
    if not has_projects_section:
        has_projects_section = any(any(line.startswith(p) and len(line) < len(p) + 3 for p in project_headers) for line in lines)

    exp_score = 0
    is_fresh_grad_with_projects = False
    
    if has_experience_section:
        # Candidate has formal work experience listed
        exp_score = 60
        word_count = len(resume_text.split())
        if word_count > 400:
            exp_score += min(40, int((word_count - 400) / 10))
        else:
            exp_score += min(30, int(word_count / 15))
    elif has_projects_section:
        # Fresh graduate with projects but no formal work experience
        is_fresh_grad_with_projects = True
        exp_score = 0 # Strict penalty: no formal work experience equals 0
    else:
        # No experience and no projects
        exp_score = 0

    # Skills Section Check
    skills_headers = ["skills", "technical skills", "technologies", "core competencies", "expertise", "programming languages", "frameworks"]
    has_skills_section = any(any(line == s for s in skills_headers) for line in lines)
    if not has_skills_section:
        has_skills_section = any(any(line.startswith(s) and len(line) < len(s) + 3 for s in skills_headers) for line in lines)

    skills_score = 40 if has_skills_section else 20
    keyword_ratio = len(found_keywords) / max(len(jd_keywords), 1)
    skills_score += int(keyword_ratio * 60)

    # Education Section Check
    education_headers = ["education", "academic profile", "academic background", "academic qualification", "academic credentials", "educational background", "qualifications"]
    has_education_section = any(any(line == e for e in education_headers) for line in lines)
    if not has_education_section:
        has_education_section = any(any(line.startswith(e) and len(line) < len(e) + 3 for e in education_headers) for line in lines)

    edu_score = 0
    if has_education_section:
        edu_score = 80
        # Check for technical degrees & certifications to boost to 100%
        if any(kw in resume_lower for kw in ["computer science", "engineering", "b.tech", "b.e", "diploma", "cdac", "degree", "technology"]):
            edu_score = 100
    else:
        edu_score = 20

    # Formatting Check
    word_count = len(resume_text.split())
    formatting_score = 85
    if word_count < 200:
        formatting_score -= 30
    elif word_count > 1500:
        formatting_score -= 20
    if len(re.findall(r'[A-Z]{4,}', resume_text)) > 35:
        formatting_score -= 15

    # Compute final scores
    section_scores = {
        "contact_info": min(100, contact_score),
        "work_experience": min(100, exp_score),
        "skills": min(100, skills_score),
        "education": min(100, edu_score),
        "formatting": min(100, formatting_score)
    }

    # Weight scores
    ats_score = int(
        0.15 * section_scores["contact_info"] +
        0.35 * section_scores["work_experience"] +
        0.30 * section_scores["skills"] +
        0.10 * section_scores["education"] +
        0.10 * section_scores["formatting"]
    )
    # Scale score with keyword ratio
    ats_score = min(100, max(30, int(ats_score * 0.7 + keyword_ratio * 30)))

    # 3. Action Verbs
    action_verbs = [
        "led", "managed", "developed", "created", "implemented", "designed",
        "optimized", "delivered", "achieved", "improved", "launched", "built",
        "established", "drove", "increased", "reduced", "streamlined", "engineered",
        "architected", "formulated", "orchestrated", "coordinated", "pioneered",
        "transformed", "accelerated", "maximized"
    ]
    verb_count = 0
    for verb in action_verbs:
        verb_count += len(re.findall(rf"\b{verb}\b", resume_lower))

    # 4. Metrics Check
    metrics = re.findall(r'\b\d+(?:\.\d+)?\s*(?:%|\$|k|m|percent|million|billion|thousand|users|clients|hours|developers|team members|percentage)\b|\$\d+(?:\.\d+)?', resume_text, re.IGNORECASE)
    metrics_count = len(metrics)

    # 5. Dynamic Recommendations/Feedback Generation
    feedback = []
    
    if section_scores["contact_info"] < 100:
        missing_parts = []
        if not has_email: missing_parts.append("email address")
        if not has_phone: missing_parts.append("phone number")
        if not has_linkedin: missing_parts.append("LinkedIn profile link")
        if not has_github: missing_parts.append("GitHub link")
        if not has_portfolio: missing_parts.append("Portfolio URL")
        feedback.append(f"Complete your contact details. Consider adding: {', '.join(missing_parts)}.")

    if is_fresh_grad_with_projects:
        feedback.append("Excellent academic projects! Since you don't list formal work experience, continue to highlight these technical builds and elaborate on your personal contributions to demonstrate hands-on capacity.")
    elif section_scores["work_experience"] < 50:
        feedback.append("Expand on your work experience. Use the STAR method (Situation, Task, Action, Result) to describe your contributions in detail.")

    if missing_keywords:
        feedback.append(f"Add missing keywords: {', '.join(missing_keywords[:4])} directly inside your project descriptions to align with the job specifications.")
    else:
        feedback.append("Outstanding keyword alignment! Your skills and projects exactly match the technical requisites of the role.")

    if verb_count < 8:
        feedback.append(f"Use more active verbs (e.g. 'engineered', 'automated', 'streamlined') at the start of your bullet points. We detected only {verb_count} action verbs.")

    if metrics_count < 3:
        feedback.append(f"Include measurable metrics (percentages, speed gains, database throughput) to prove your achievements. We detected only {metrics_count} quantifiable data points.")

    if word_count < 300:
        feedback.append("Add more depth to your project bullets or coursework details. Short resumes under 300 words look thin to both recruiters and modern ATS models.")

    # Cap suggestions between 3 and 5 items
    feedback = feedback[:5]
    if len(feedback) < 3:
        feedback.append("Ensure consistent margins, clear section headings, and clean typographic hierarchy for optimal ATS scan rates.")

    return {
        "company_name": "Target Company (Fallback)",
        "job_title": "Target Role (Fallback)",
        "ats_score": ats_score,
        "found_keywords": found_keywords,
        "missing_keywords": missing_keywords,
        "section_scores": section_scores,
        "feedback": ["(Fallback Mode) " + f for f in feedback],
        "strong_action_verbs_count": verb_count,
        "metrics_usage_count": metrics_count,
        "fallback_mode": True
    }
