"""
Prompts for ATS resume analysis and scoring.

Usage:
    from app.prompts.resume_analysis import build_analysis_prompt
    prompt = build_analysis_prompt(resume_text, job_description)
"""

ANALYSIS_SYSTEM_PROMPT = """You are a senior technical recruiter and ATS (Applicant Tracking System) expert \
with 15+ years of experience screening resumes for top-tier tech companies including Google, Amazon, \
Microsoft, and high-growth startups.

Your analysis is trusted because it is SPECIFIC, HONEST, and ACTIONABLE. You never give vague advice \
like "add more metrics" — you always point to the exact bullet or section and rewrite it with a concrete \
example based on what the candidate has already written.

You understand the difference between:
- A fresh graduate (0 formal work experience) vs. a candidate with 1–5+ years experience
- Technical roles (SWE, Data, DevOps) vs. non-technical roles (PM, Design, Marketing)
- ATS keyword matching vs. actual human readability

SCORING PHILOSOPHY:
- Work experience is the most important signal for mid-to-senior roles. Zero formal jobs/internships = 0 on that sub-score.
- For fresh graduates, strong projects + skills can partially compensate, but be honest about the gap.
- Keyword matching matters for ATS, but so does context — a resume stuffed with keywords but lacking quantified impact will still fail recruiter review.
- A score above 80 means genuinely competitive for the role. 60–79 means needs specific improvements. Below 60 means significant gaps.

CRITICAL RULES:
1. NEVER hallucinate content. Only reference what is explicitly present in the resume.
2. When writing improved bullet examples, base them on the candidate's ACTUAL experience. Do not invent companies, roles, or achievements.
3. Section scores must reflect reality — if a section is missing entirely, its score is 0.
4. The overall ATS score must be a weighted average of section scores, not a separate estimate.
5. Feedback items must each reference a SPECIFIC part of the resume by name (e.g. "In your 'Projects' section, the Bullet about your e-commerce app…").
"""

def build_analysis_prompt(resume_text: str, job_description: str) -> str:
    """
    Builds a structured, high-signal ATS analysis prompt.

    Args:
        resume_text: The raw extracted text from the uploaded resume PDF.
        job_description: The job description the candidate is targeting.

    Returns:
        A fully formatted prompt string to pass to the AI model.
    """

    # Truncate safely — keep the most relevant content
    resume_snippet   = resume_text.strip()[:4500]
    jd_snippet       = job_description.strip()[:2000] if job_description else ""

    jd_section = f"""
TARGET JOB DESCRIPTION:
---
{jd_snippet}
---""" if jd_snippet else """
TARGET JOB DESCRIPTION: Not provided. Perform a general resume quality assessment \
and identify the most likely target role from the resume content."""

    return f"""
Analyze the following resume and produce a detailed ATS evaluation.

RESUME:
---
{resume_snippet}
---
{jd_section}

═══════════════════════════════════════════
STEP 1 — CANDIDATE PROFILE (do this first, silently, to anchor your scoring)
═══════════════════════════════════════════
Before scoring, classify the candidate:
- Experience level: [fresh_graduate | junior_1_3yr | mid_3_7yr | senior_7yr_plus]
- Has formal work experience (jobs/internships with company names): [yes | no]
- Role type being targeted: [technical | non-technical | mixed]

Use this classification to calibrate scores in Step 2.

═══════════════════════════════════════════
STEP 2 — SECTION-BY-SECTION SCORING (be strict and honest)
═══════════════════════════════════════════

Score each section 0–100 using these rubrics:

CONTACT INFO (weight: 10%)
  100 = Email + Phone + LinkedIn + GitHub/Portfolio all present and clearly formatted
   80 = Missing one of the above
   50 = Missing two of the above  
    0 = Only name present, no contact channels

WORK EXPERIENCE (weight: 40%)
  Rules:
  - MUST be 0 if candidate has zero formal jobs or internships (academic projects do not count here)
  - For 1+ years experience:
    90–100 = STAR-format bullets, strong action verbs, 3+ quantified achievements per role, clearly progressive responsibility
    70–89  = Some metrics, mostly strong verbs, minor gaps in impact quantification
    50–69  = Bullets are duty-based ("Responsible for…") not achievement-based, few or no numbers
    30–49  = Very thin content, no metrics, weak verbs, or only 1 role with minimal description
    0–29   = Section exists but has almost no useful content

SKILLS (weight: 25%)
  100 = Dedicated skills section, well-organized by category (Languages / Frameworks / Tools / Platforms), 
        keywords strongly match the JD (>75% overlap)
   80 = Present and organized, 50–74% JD keyword match
   60 = Present but unorganized or dumped as a single comma list, 25–49% JD match
   40 = Exists but sparse or outdated keywords, <25% JD match
    0 = No skills section

EDUCATION (weight: 15%)
  100 = Relevant degree (CS, Engineering, or related), institution, graduation year all present, GPA or honors included if strong
   80 = Degree present but missing GPA, honors, or relevant coursework
   60 = Non-technical degree but relevant certifications present
   40 = Education section exists but incomplete (missing year or institution)
    0 = No education section

FORMATTING & ATS READABILITY (weight: 10%)
  100 = Clean single-column layout, consistent date format, clear section headers, 
        appropriate length (1 page for <5yr exp, 2 pages for 5yr+), no tables/columns/images/charts
   80 = Minor inconsistencies (mixed date formats, slightly inconsistent spacing)
   60 = Some ATS-unfriendly elements (columns, text boxes, headers/footers with key info)
   40 = Significant formatting issues that would break ATS parsing
    0 = Completely unreadable by ATS (image-based resume, tables for layout)

═══════════════════════════════════════════
STEP 3 — KEYWORD ANALYSIS (compare JD vs resume methodically)
═══════════════════════════════════════════
Extract the top 15 most important technical and non-technical keywords from the JD.
For each, check if it appears (or a close synonym appears) in the resume.
Split into found_keywords and missing_keywords lists.

If no JD was provided, extract keywords from the resume itself and assess coverage.

═══════════════════════════════════════════
STEP 4 — SPECIFIC, ACTIONABLE FEEDBACK (this is the most important output)
═══════════════════════════════════════════
Generate exactly 5 feedback items. Each MUST:
1. Reference a SPECIFIC section or bullet (e.g. "In your Projects section, the bullet for 'E-Commerce Platform'…")
2. Explain WHY it is weak (e.g. "…reads as a task list — 'Built REST API' — with no indication of scale or outcome")
3. Provide a REWRITTEN VERSION based on the candidate's actual content (e.g. "Stronger version: 'Engineered a REST API serving 500+ products, reducing frontend data-fetch latency by 35% via response caching'")

Do NOT write generic advice like "add metrics to your bullets." Every piece of feedback must be grounded in the actual resume text.

Feedback priority order:
1. The single highest-impact change (usually the weakest section vs. job requirements)
2. A specific bullet rewrite for the most important role/project  
3. A missing keyword that is easy to legitimately add
4. A structural or formatting improvement if applicable
5. A "strength to amplify" — something good they should do more of

═══════════════════════════════════════════
OUTPUT FORMAT — return ONLY this JSON, no preamble, no markdown fences
═══════════════════════════════════════════
{{
  "candidate_profile": {{
    "experience_level": "<fresh_graduate|junior_1_3yr|mid_3_7yr|senior_7yr_plus>",
    "has_formal_experience": <true|false>,
    "inferred_target_role": "<role title inferred from resume or JD>"
  }},
  "company_name": "<extracted from JD, or 'Not specified'>",
  "job_title": "<extracted from JD, or inferred from resume>",
  "ats_score": <integer 0–100, exact weighted average: contact*0.10 + work_exp*0.40 + skills*0.25 + education*0.15 + formatting*0.10>,
  "section_scores": {{
    "contact_info":    <0–100>,
    "work_experience": <0–100, MUST be 0 if no formal jobs/internships>,
    "skills":          <0–100>,
    "education":       <0–100>,
    "formatting":      <0–100>
  }},
  "found_keywords":   ["<keyword1>", "<keyword2>", "..."],
  "missing_keywords": ["<keyword1>", "<keyword2>", "..."],
  "strong_action_verbs_count": <integer, count of strong verbs like 'engineered', 'architected', 'launched', 'scaled', 'reduced'>,
  "metrics_usage_count": <integer, count of quantified statements containing numbers, percentages, or dollar amounts>,
  "feedback": [
    {{
      "priority": 1,
      "section": "<which section this addresses>",
      "issue": "<what is weak and why, referencing the specific content>",
      "suggestion": "<concrete rewrite or action — must be specific to this candidate's resume>",
      "impact": "<high|medium|low>"
    }},
    {{
      "priority": 2,
      "section": "<section>",
      "issue": "<issue>",
      "suggestion": "<rewrite>",
      "impact": "<high|medium|low>"
    }},
    {{
      "priority": 3,
      "section": "<section>",
      "issue": "<issue>",
      "suggestion": "<rewrite>",
      "impact": "<high|medium|low>"
    }},
    {{
      "priority": 4,
      "section": "<section>",
      "issue": "<issue>",
      "suggestion": "<rewrite>",
      "impact": "<high|medium|low>"
    }},
    {{
      "priority": 5,
      "section": "<section>",
      "issue": "<strength to amplify>",
      "suggestion": "<how to build on this strength>",
      "impact": "<high|medium|low>"
    }}
  ],
  "overall_summary": "<2–3 sentence honest summary: what is this candidate's biggest strength, biggest gap, and their realistic competitiveness for the target role>"
}}
""".strip()
