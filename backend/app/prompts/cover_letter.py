"""
Prompts for generating targeted cover letters.

Usage:
    from app.prompts.cover_letter import build_cover_letter_prompt
    prompt = build_cover_letter_prompt(resume_text, job_description, user_context)
"""


def build_cover_letter_prompt(
    resume_text: str,
    job_description: str,
    user_context: dict | None = None,
) -> str:
    """
    Builds a prompt for generating a targeted, non-generic cover letter.

    Args:
        resume_text:     Full extracted resume text.
        job_description: The target JD.
        user_context:    Optional dict with keys:
                           - tone: 'formal' | 'conversational' | 'startup'
                           - word_limit: int (default 300)
                           - highlight: str (specific achievement to lead with)
                           - why_company: str (candidate's stated reason for applying)

    Returns:
        A formatted prompt string.
    """

    ctx = user_context or {}
    tone          = ctx.get("tone", "professional but warm")
    word_limit    = ctx.get("word_limit", 300)
    highlight     = ctx.get("highlight", "")
    why_company   = ctx.get("why_company", "")

    highlight_line = (
        f"\nCANDIDATE WANTS TO HIGHLIGHT: {highlight.strip()}"
        if highlight else ""
    )
    why_line = (
        f"\nWHY THEY WANT THIS COMPANY (in their words): {why_company.strip()}"
        if why_company else ""
    )

    resume_snippet = resume_text.strip()[:3500]
    jd_snippet = job_description.strip()[:1800]

    return f"""You are a professional cover letter writer who creates letters that sound like a \
real human wrote them — not a template. Your letters are compelling because they make ONE specific \
connection between the candidate's strongest relevant achievement and the company's actual need.

TONE: {tone}
TARGET LENGTH: {word_limit} words maximum (3 tight paragraphs)

ANTI-PATTERNS to AVOID (these make letters generic and forgettable):
- Do NOT open with "I am writing to express my interest in…"
- Do NOT list skills that are already obvious from the resume
- Do NOT use vague phrases like "I am a passionate, results-driven professional"
- Do NOT close with "I look forward to hearing from you at your earliest convenience"
- Do NOT mention every job in the resume — pick ONE achievement and go deep on it

STRUCTURE:
Paragraph 1 (Hook, 2–3 sentences):
  Open with the candidate's single most relevant achievement that directly addresses 
  a pain point visible in the JD. Make the hiring manager think "this person gets what we need."

Paragraph 2 (Proof, 3–4 sentences):
  One specific story from their experience — what problem they faced, what they did, 
  what the outcome was. Connect it explicitly to the target role's responsibilities.
  Reference the company by name and show you understand their product/mission.

Paragraph 3 (Forward, 2–3 sentences):
  Express genuine interest in a specific aspect of the company/role (not just "your innovative culture").
  End with a confident, direct call to action — not begging.

RESUME:
---
{resume_snippet}
---

JOB DESCRIPTION:
---
{jd_snippet}
---
{highlight_line}
{why_line}

Return ONLY this JSON, no markdown fences:
{{
  "cover_letter": "<full letter text, with paragraph breaks as \\n\\n>",
  "hook_achievement": "<which specific achievement was used as the hook and why>",
  "jd_pain_point_addressed": "<what specific need from the JD this letter targets>",
  "word_count": <integer>,
  "subject_line": "<suggested email subject line if sending directly>"
}}
""".strip()
