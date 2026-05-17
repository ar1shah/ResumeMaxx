import re

# Matches "N years", "N+ years", "N-M years" in various forms.
# Excludes 4-digit year numbers like 2021 by requiring < 4 digits before "years".
_RESUME_YEARS_RE = re.compile(
    r"\b(\d{1,2})\+?\s*(?:[-\u2013\u2014]|to)?\s*(\d{1,2})?\s*(?:\+)?\s+years?\b",
    re.I,
)

# JD patterns like "3-5 years", "3+ years", "at least 3 years", "minimum 3 years", "3 years of"
# The dash in ranges can be ASCII hyphen, en-dash (U+2013), or em-dash (U+2014).
_JD_RANGE_RE = re.compile(
    r"(\d+)\s*[-\u2013\u2014]\s*(\d+)\s*\+?\s*years?\b",
    re.I,
)
_JD_MIN_RE = re.compile(
    r"(?:minimum|at least|min\.?|>\s*)(\d+)\+?\s*years?\b",
    re.I,
)
_JD_PLUS_RE = re.compile(
    r"(\d+)\+\s*years?\b",
    re.I,
)
_JD_PLAIN_RE = re.compile(
    r"(\d+)\s*years?\s*(?:of\b|experience\b)",
    re.I,
)


def extract_resume_years(resume_text: str) -> float | None:
    """Return the maximum years of experience mentioned in the resume, or None."""
    matches = _RESUME_YEARS_RE.findall(resume_text)
    if not matches:
        return None
    years: list[float] = []
    for low, high in matches:
        years.append(float(high) if high else float(low))
    return max(years) if years else None


def extract_jd_years(jd_text: str) -> tuple[float, float] | None:
    """Return (min_years, max_years) required by the JD, or None if not found.

    When only a minimum is given (e.g. "3+ years"), max is set to min + 3 as a
    practical ceiling so the scoring doesn't penalise senior candidates.
    """
    # Try "N-M years" range first
    m = _JD_RANGE_RE.search(jd_text)
    if m:
        return float(m.group(1)), float(m.group(2))

    # "minimum N years" / "at least N years"
    m = _JD_MIN_RE.search(jd_text)
    if m:
        n = float(m.group(1))
        return n, n + 3

    # "N+ years"
    m = _JD_PLUS_RE.search(jd_text)
    if m:
        n = float(m.group(1))
        return n, n + 3

    # "N years of experience" / "N years experience"
    m = _JD_PLAIN_RE.search(jd_text)
    if m:
        n = float(m.group(1))
        return n, n + 3

    return None


def experience_fit_score(resume_text: str, jd_text: str) -> float:
    """Score [0, 100] reflecting how well the candidate's years of experience
    match the JD's requirement.

    Rules:
      - No signal from either source → 70 (neutral; don't punish the unknown)
      - Candidate years in [min, max] → 100
      - 1 year below minimum → 80 (nearly qualified)
      - 2 years below minimum → 65
      - 3+ years below minimum → 45
      - Above max by any amount → 95 (overqualified, not a disqualifier)
    """
    resume_years = extract_resume_years(resume_text)
    jd_range = extract_jd_years(jd_text)

    if resume_years is None or jd_range is None:
        return 70.0

    min_req, max_req = jd_range

    if resume_years >= min_req:
        # In range or above: senior candidates are slightly discounted only
        # when wildly overqualified (>5 yrs above max), otherwise full credit.
        if resume_years <= max_req + 5:
            return 100.0
        return 90.0

    gap = min_req - resume_years
    if gap <= 1:
        return 80.0
    if gap <= 2:
        return 65.0
    return 45.0
