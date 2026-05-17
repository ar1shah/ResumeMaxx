from app.services.jd_extract import extract_jd
from app.services.skills import classify_jd_skills, compute_skill_fit
from app.services.scorer import requirements_coverage, score_sections
from app.services.experience import experience_fit_score
from dataclasses import dataclass

# Section weights: experience and skills sections are most predictive of fit.
_SECTION_WEIGHTS: dict[str, float] = {
    "experience": 2.0,
    "skills": 1.5,
    "summary": 1.0,
    "projects": 1.0,
    "certifications": 0.75,
}
_DEFAULT_SECTION_WEIGHT = 0.75

# Composite component weights — must sum to 1.0
_W_SKILL = 0.40
_W_LEXICAL = 0.30
_W_EXPERIENCE = 0.15
_W_SECTION = 0.15


@dataclass
class ScoreBreakdown:
    skill_fit: float
    lexical_coverage: float
    experience_fit: float
    section_relevance: float


def _weighted_section_score(
    sections: dict[str, str],
    requirements_text: str,
) -> float:
    """Weighted average of per-section TF-IDF coverage vs requirements text."""
    section_scores = score_sections(sections, requirements_text)
    if not section_scores:
        return 50.0

    total_weight = 0.0
    weighted_sum = 0.0
    for s in section_scores:
        w = _SECTION_WEIGHTS.get(s["section"], _DEFAULT_SECTION_WEIGHT)
        weighted_sum += w * s["score"]
        total_weight += w

    return weighted_sum / total_weight if total_weight > 0 else 50.0


def compute_match_score(
    resume_text: str,
    jd_text: str,
    sections: dict[str, str],
) -> tuple[int, ScoreBreakdown]:
    """Composite 0–100 match score with per-component breakdown.

    Components:
      - skill_fit (40%): vocabulary-matched skills weighted by required vs nice-to-have
      - lexical_coverage (30%): fraction of JD requirements TF-IDF mass covered by resume
      - experience_fit (15%): years-of-experience alignment
      - section_relevance (15%): weighted per-section coverage vs requirements

    Returns (overall_score, ScoreBreakdown).
    """
    jd_extract = extract_jd(jd_text)
    req_text = jd_extract.requirements_text

    classified = classify_jd_skills(jd_text)
    skill_fit = compute_skill_fit(resume_text, classified)

    cov = requirements_coverage(resume_text, req_text)
    # Calibration: coverage * 120, capped at 100, so ~0.70 coverage → 84.
    lexical = min(100.0, cov * 120)

    exp_fit = experience_fit_score(resume_text, jd_text)

    sec_rel = _weighted_section_score(sections, req_text)

    overall = round(
        _W_SKILL * skill_fit
        + _W_LEXICAL * lexical
        + _W_EXPERIENCE * exp_fit
        + _W_SECTION * sec_rel
    )
    overall = max(0, min(100, overall))

    breakdown = ScoreBreakdown(
        skill_fit=round(skill_fit, 1),
        lexical_coverage=round(lexical, 1),
        experience_fit=round(exp_fit, 1),
        section_relevance=round(sec_rel, 1),
    )
    return overall, breakdown
