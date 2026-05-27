"""
Prompts for rewriting individual resume bullet points.

Usage:
    from app.prompts.bullet_rewrite import build_bullet_rewrite_prompt
    prompt = build_bullet_rewrite_prompt(bullet_text, job_description, context)
"""


def build_bullet_rewrite_prompt(
    bullet_text: str,
    job_description: str,
    section_context: str = "",
    candidate_level: str = "unknown",
) -> str:
    """
    Builds a high-quality prompt for rewriting a single resume bullet point.

    Args:
        bullet_text:      The original bullet text to improve.
        job_description:  The target JD for keyword alignment.
        section_context:  Optional — which section this bullet is from
                          (e.g. "Software Engineer Intern at XYZ Corp, June–Aug 2023").
                          Providing this significantly improves rewrite quality.
        candidate_level:  fresh_graduate | junior | mid | senior

    Returns:
        A fully formatted prompt string.
    """

    jd_snippet = job_description.strip()[:1200] if job_description else ""
    context_line = f"\nROLE/PROJECT CONTEXT: {section_context.strip()}" if section_context else ""
    level_guidance = _level_guidance(candidate_level)

    jd_block = f"""
TARGET JOB DESCRIPTION (for keyword alignment):
---
{jd_snippet}
---""" if jd_snippet else """
TARGET JOB DESCRIPTION: Not provided. Focus on general impact and clarity."""

    return f"""You are an elite resume writer who has helped 500+ engineers land roles at FAANG and \
top startups. You understand that a great resume bullet follows the formula:

  STRONG VERB + WHAT YOU DID + HOW YOU DID IT + MEASURABLE RESULT

Your rewrites are SPECIFIC to the candidate's original text. You never invent companies, team sizes, \
or achievements that are not implied by the original. Instead, you transform vague task descriptions \
into achievement-oriented statements by:
1. Replacing weak verbs ("worked on", "helped", "was responsible for") with precise action verbs
2. Adding scale/context if it can be inferred (e.g. "single-page application" → "React SPA")
3. Inserting a result or outcome even if approximate (e.g. "improving load time", "reducing bug count")
4. Matching 1–2 keywords from the target JD naturally — never keyword-stuffing

{level_guidance}

ORIGINAL BULLET:
"{bullet_text.strip()}"
{context_line}
{jd_block}

═══════════════════════════════════════
TASK: Produce THREE rewrite options, ordered from conservative to aggressive.
═══════════════════════════════════════

Option 1 — CONSERVATIVE: Minimal changes. Fix the verb, tighten the language, keep all original claims.
Option 2 — BALANCED: Restructure using VERB + WHAT + HOW + RESULT format. Add one inferred metric or outcome.
Option 3 — AGGRESSIVE: Maximum impact. Strong technical verb, inferred scale, clear business/technical outcome, 1–2 JD keywords.

RULES:
- Each rewrite must be 1–2 lines maximum (under 25 words preferred)
- Never start two options with the same verb
- Never invent specific numbers (e.g. do NOT add "improved performance by 40%" unless the original implies it)
- DO suggest where a number could go with a placeholder if the candidate has the data, e.g. "reduced page load time by [X%]"
- Each option must be standalone — the hiring manager sees only this bullet, not the original

Return ONLY this JSON, no markdown fences, no preamble:
{{
  "original": "{bullet_text.strip()[:200]}",
  "diagnosis": "<1 sentence: what is the specific weakness of the original — be direct>",
  "rewrites": [
    {{
      "option": 1,
      "label": "Conservative",
      "text": "<rewritten bullet>",
      "changes_made": "<brief explanation of what changed and why>"
    }},
    {{
      "option": 2,
      "label": "Balanced",
      "text": "<rewritten bullet>",
      "changes_made": "<brief explanation>"
    }},
    {{
      "option": 3,
      "label": "Aggressive",
      "text": "<rewritten bullet>",
      "changes_made": "<brief explanation>"
    }}
  ],
  "keywords_added": ["<any JD keywords naturally incorporated>"],
  "placeholder_metrics": "<if the candidate should add a number somewhere, describe exactly where and what to measure>"
}}
""".strip()


def _level_guidance(level: str) -> str:
    """Returns level-appropriate rewrite guidance."""
    guides = {
        "fresh_graduate": (
            "CANDIDATE LEVEL: Fresh graduate. "
            "Emphasize technical depth, learning agility, and project ownership. "
            "Acceptable to reference academic/personal projects as primary experience. "
            "Avoid implying team leadership if not stated."
        ),
        "junior": (
            "CANDIDATE LEVEL: Junior (1–3 years). "
            "Focus on contribution to team outcomes, specific technical skills applied, "
            "and individual deliverables. Avoid overselling leadership."
        ),
        "mid": (
            "CANDIDATE LEVEL: Mid-level (3–7 years). "
            "Emphasize ownership, technical decisions, cross-functional impact, "
            "and measurable business outcomes. Can reference team coordination."
        ),
        "senior": (
            "CANDIDATE LEVEL: Senior (7+ years). "
            "Lead with strategic impact, architectural decisions, team/org influence, "
            "and business metrics. Technical details should support business outcomes, not replace them."
        ),
        "unknown": (
            "CANDIDATE LEVEL: Unknown. Write at a mid-level tone — "
            "balance technical specificity with outcome-focus."
        ),
    }
    return guides.get(level, guides["unknown"])
