"""
app.prompts — Centralized AI prompt library

All prompts are versioned here. Never hardcode prompt strings in services/.

Quick reference:
  from app.prompts import (
      build_analysis_prompt,       # ATS resume scoring
      build_bullet_rewrite_prompt, # Bullet enhancement
      build_cover_letter_prompt,   # Cover letter generation
      build_question_generation_prompt,  # Mock interview questions
      build_star_evaluation_prompt,      # STAR answer scoring
      build_session_debrief_prompt,      # End-of-session coaching
      ANALYSIS_SYSTEM_PROMPT,      # System prompt for analysis calls
  )
"""

from .resume_analysis import build_analysis_prompt, ANALYSIS_SYSTEM_PROMPT
from .bullet_rewrite import build_bullet_rewrite_prompt
from .cover_letter import build_cover_letter_prompt
from .interview import (
    build_question_generation_prompt,
    build_star_evaluation_prompt,
    build_session_debrief_prompt,
)

__all__ = [
    "ANALYSIS_SYSTEM_PROMPT",
    "build_analysis_prompt",
    "build_bullet_rewrite_prompt",
    "build_cover_letter_prompt",
    "build_question_generation_prompt",
    "build_star_evaluation_prompt",
    "build_session_debrief_prompt",
]
