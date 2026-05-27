"""
Prompts for the AI mock interview system.

Three main functions:
  1. build_question_generation_prompt — generates role-specific interview questions
  2. build_star_evaluation_prompt     — evaluates a candidate's spoken answer
  3. build_session_debrief_prompt     — end-of-session summary and coaching report

Usage:
    from app.prompts.interview import (
        build_question_generation_prompt,
        build_star_evaluation_prompt,
        build_session_debrief_prompt,
    )
"""


# ─── 1. Question Generation ──────────────────────────────────────────────────

def build_question_generation_prompt(
    resume_text: str,
    job_description: str,
    company_context: str = "",
    num_questions: int = 8,
    question_types: list[str] | None = None,
) -> str:
    """
    Generates a tailored set of interview questions grounded in the
    candidate's actual resume and the target role.

    Args:
        resume_text:       Full resume text.
        job_description:   Target JD.
        company_context:   Optional RAG-retrieved company profile
                           (e.g. Amazon Leadership Principles, Google L&S values).
        num_questions:     Total questions to generate (default 8).
        question_types:    List from ['behavioral', 'technical', 'situational', 'resume_deep_dive'].
                           Defaults to a balanced mix.

    Returns:
        Formatted prompt string.
    """

    qtypes = question_types or ["behavioral", "technical", "situational", "resume_deep_dive"]
    q_distribution = _question_distribution(qtypes, num_questions)

    company_block = f"""
COMPANY-SPECIFIC CONTEXT (use this to generate culturally aligned questions):
---
{company_context.strip()[:1500]}
---""" if company_context else ""

    return f"""You are a senior interviewer who has conducted 1,000+ technical and behavioral interviews \
at top tech companies. You generate interview questions that are:
1. GROUNDED in the candidate's actual resume — questions about their specific projects, not generic questions
2. RELEVANT to the target role — matching the seniority, technical depth, and function in the JD  
3. DIFFERENTIATED — not the same 5 generic questions every candidate gets

You know that the best interview questions make candidates think. "Tell me about yourself" is not a good question.
"I see you built a recommendation engine at [Company] — walk me through how you handled cold-start problem" is.

RESUME:
---
{resume_text.strip()[:3000]}
---

JOB DESCRIPTION:
---
{job_description.strip()[:1800]}
---
{company_block}

QUESTION DISTRIBUTION TO GENERATE:
{q_distribution}

RULES:
- Resume deep-dive questions MUST reference a specific project, role, or claim from the resume
- Behavioral questions should use the "Tell me about a time…" or "Describe a situation…" format
- Technical questions should match the skills listed in both the resume AND the JD
- Situational questions should reflect real challenges common in the target role
- Include a difficulty rating for each question (easy/medium/hard)
- Include what the interviewer is actually trying to assess with each question

Return ONLY this JSON, no markdown fences:
{{
  "questions": [
    {{
      "id": 1,
      "type": "<behavioral|technical|situational|resume_deep_dive>",
      "difficulty": "<easy|medium|hard>",
      "question": "<the actual interview question>",
      "what_interviewer_assesses": "<1 sentence: what skill/trait/signal this question surfaces>",
      "ideal_answer_keywords": ["<key concepts a strong answer should mention>"],
      "follow_up": "<a natural follow-up question if the candidate gives a surface-level answer>"
    }}
  ],
  "role_summary": "<1 sentence describing the candidate's likely interview focus areas given their background>",
  "hardest_question_to_answer": "<id of the question most likely to trip up this specific candidate, and why>"
}}
""".strip()


def _question_distribution(qtypes: list[str], total: int) -> str:
    """Returns a human-readable distribution string."""
    per_type = total // len(qtypes)
    remainder = total % len(qtypes)
    lines = []
    for i, qt in enumerate(qtypes):
        count = per_type + (1 if i < remainder else 0)
        lines.append(f"  - {count}x {qt.replace('_', ' ').title()}")
    return "\n".join(lines)


# ─── 2. STAR Answer Evaluation ───────────────────────────────────────────────

def build_star_evaluation_prompt(
    question: str,
    transcribed_answer: str,
    job_description: str = "",
    ideal_answer_keywords: list[str] | None = None,
) -> str:
    """
    Evaluates a candidate's spoken answer against the STAR framework.

    Args:
        question:                The interview question that was asked.
        transcribed_answer:      Whisper-transcribed text of the candidate's answer.
        job_description:         Target JD for relevance scoring.
        ideal_answer_keywords:   From question generation — what the answer should cover.

    Returns:
        Formatted evaluation prompt string.
    """

    keywords_block = ""
    if ideal_answer_keywords:
        keywords_block = f"\nKEY CONCEPTS A STRONG ANSWER SHOULD COVER: {', '.join(ideal_answer_keywords)}"

    jd_block = f"\nTARGET ROLE CONTEXT:\n{job_description.strip()[:800]}" if job_description else ""

    return f"""You are a professional interview coach evaluating a candidate's spoken interview answer.
Your feedback is HONEST, SPECIFIC, and CONSTRUCTIVE — not generic encouragement.

You evaluate against the STAR framework:
  S = Situation: Did they set the scene clearly and concisely?
  T = Task: Did they explain their specific responsibility/goal?
  A = Action: Did they focus on THEIR actions (not the team's)?
  R = Result: Did they quantify the outcome or clearly state the impact?

You also assess:
  - Communication clarity: Was it easy to follow? Clear structure?
  - Relevance: How well did the answer address what the question was actually asking?
  - Confidence signals: Did they hedge excessively ("I think we kind of…") or speak with conviction?
  - Filler words: Count instances of "um", "uh", "like", "you know", "basically", "literally", "kind of", "sort of"

INTERVIEW QUESTION:
"{question}"

CANDIDATE'S ANSWER (transcribed):
---
{transcribed_answer.strip()}
---
{keywords_block}
{jd_block}

EVALUATION GUIDELINES:
- Score each STAR component 0–10. A 10 requires specific, quantified, clearly explained content.
- Overall score = (S + T + A*2 + R*2) / 6 — Action and Result are weighted double as they're most important.
- Identify the SINGLE most important thing they should change for the next answer.
- If the answer is missing a STAR component entirely, the score for that component is 0–2 max.
- Filler word count above 5 per minute of speaking should be flagged as a coaching point.
- Provide a 2-sentence "stronger version" opener — how they should have started this answer.

Return ONLY this JSON, no markdown fences:
{{
  "star_scores": {{
    "situation": <0–10>,
    "task":      <0–10>,
    "action":    <0–10>,
    "result":    <0–10>
  }},
  "overall_score": <0–10, one decimal place>,
  "star_breakdown": {{
    "situation_feedback": "<what they said / what was missing>",
    "task_feedback":      "<what they said / what was missing>",
    "action_feedback":    "<what they said / what was missing>",
    "result_feedback":    "<what they said / what was missing>"
  }},
  "filler_word_count": <integer>,
  "filler_words_detected": ["<list of detected filler words>"],
  "communication_score": <0–10>,
  "relevance_score": <0–10>,
  "top_strength": "<the single best thing about this answer>",
  "top_improvement": "<the single most important thing to change — be specific>",
  "stronger_opening": "<a rewritten 2-sentence opening that would have been stronger>",
  "missing_keywords": ["<key concepts from ideal_answer_keywords that were not mentioned>"],
  "coaching_note": "<1–2 sentences of specific, actionable coaching advice for their next behavioral answer>"
}}
""".strip()


# ─── 3. Session Debrief ──────────────────────────────────────────────────────

def build_session_debrief_prompt(
    question_answer_pairs: list[dict],
    job_description: str = "",
    candidate_name: str = "Candidate",
) -> str:
    """
    Generates an end-of-session coaching report after a full mock interview.

    Args:
        question_answer_pairs: List of dicts, each with:
                                 - question: str
                                 - answer: str
                                 - star_scores: dict (from evaluation)
                                 - overall_score: float
        job_description:       Target JD.
        candidate_name:        For personalization.

    Returns:
        Formatted prompt string.
    """

    # Summarize the session for the prompt — keep it tight
    session_summary = "\n".join([
        f"Q{i+1} [{qa.get('type','behavioral')}] Score: {qa.get('overall_score', 'N/A')}/10\n"
        f"  Question: {qa.get('question','')[:120]}\n"
        f"  Answer summary: {qa.get('answer','')[:200]}..."
        for i, qa in enumerate(question_answer_pairs[:10])
    ])

    avg_score = (
        sum(qa.get("overall_score", 0) for qa in question_answer_pairs) /
        len(question_answer_pairs)
    ) if question_answer_pairs else 0

    return f"""You are a senior interview coach producing an end-of-session performance report.
Your report is HONEST (candidates need truth, not flattery), SPECIFIC (point to real answers), 
and FORWARD-LOOKING (here's exactly what to practice before the real interview).

CANDIDATE: {candidate_name}
SESSION AVERAGE SCORE: {avg_score:.1f}/10
TARGET ROLE: {job_description.strip()[:400] if job_description else 'Not specified'}

SESSION TRANSCRIPT SUMMARY:
---
{session_summary}
---

Generate a coaching debrief that covers:
1. Overall readiness assessment (how ready are they for the real interview, honestly?)
2. Top 2 consistent strengths (across all answers, not just one)
3. Top 3 weak patterns (recurring issues across multiple answers — e.g. "always skips quantifying results")
4. Specific answers to be proud of (which Q# was their best and why)
5. Specific answers that need a full redo (which Q# was weakest and an example of what a better answer structure looks like)
6. A focused 7-day practice plan (specific, actionable steps, not "practice more")

Return ONLY this JSON, no markdown fences:
{{
  "readiness_level": "<not_ready|needs_work|almost_there|interview_ready>",
  "readiness_summary": "<2–3 honest sentences about where they stand>",
  "average_score": {avg_score:.1f},
  "strengths": [
    {{"pattern": "<strength>", "example_from_session": "<which question showed this>"}}
  ],
  "improvement_areas": [
    {{
      "pattern": "<recurring weakness>",
      "frequency": "<how often it appeared, e.g. '4 out of 6 answers'>",
      "coaching_fix": "<specific technique or reframe to fix this>"
    }}
  ],
  "best_answer": {{
    "question_number": <int>,
    "why_it_worked": "<specific praise>"
  }},
  "worst_answer": {{
    "question_number": <int>,
    "root_cause": "<why it fell flat>",
    "rewrite_framework": "<how to restructure this answer for the real interview>"
  }},
  "seven_day_plan": [
    {{"day": "Day 1–2", "task": "<specific practice task>"}},
    {{"day": "Day 3–4", "task": "<specific practice task>"}},
    {{"day": "Day 5–6", "task": "<specific practice task>"}},
    {{"day": "Day 7",   "task": "<final prep task>"}}
  ]
}}
""".strip()
