import re
from pathlib import Path
from functools import lru_cache
from app.models.schemas import BulletFeedback


@lru_cache(maxsize=1)
def _load_verbs() -> frozenset[str]:
    verbs_path = Path(__file__).parent.parent.parent / "data" / "action_verbs.txt"
    return frozenset(
        line.strip().lower()
        for line in verbs_path.read_text().splitlines()
        if line.strip()
    )


# Patterns for passive / weak bullet openings
_PASSIVE_PATTERNS = [
    re.compile(r"^was responsible for", re.I),
    re.compile(r"^responsible for", re.I),
    re.compile(r"^helped (with|to)", re.I),
    re.compile(r"^assisted (with|in)", re.I),
    re.compile(r"^worked on", re.I),
    re.compile(r"^participated in", re.I),
    re.compile(r"^involved in", re.I),
    re.compile(r"^duties included", re.I),
    re.compile(r"^tasked with", re.I),
]

# Numbers, percentages, dollar amounts, multipliers
_METRIC_RE = re.compile(
    r"\b\d[\d,.]*\s*(%|x|×|times|k|m|b|million|billion|\$|dollars?|usd)\b|\$[\d,.]+|\b\d{2,}\b",
    re.I,
)


def audit_bullets(experience_text: str) -> list[BulletFeedback]:
    verbs = _load_verbs()

    lines = [l.strip() for l in experience_text.splitlines() if l.strip()]
    # Accept lines that start with a bullet marker or are long enough to be a bullet
    bullet_lines = [
        l for l in lines
        if re.match(r"^[•\-\*\u2022\u2013]", l) or len(l.split()) >= 5
    ]

    if not bullet_lines:
        return []

    feedback: list[BulletFeedback] = []
    for raw in bullet_lines:
        text = re.sub(r"^[•\-\*\u2022\u2013]\s*", "", raw)
        issues: list[str] = []

        # 1. Strong action verb
        first_word = re.sub(r"[^a-z]", "", (text.split()[0] if text.split() else "").lower())
        if first_word and first_word not in verbs:
            issues.append(f'Starts with "{first_word}" — consider a strong action verb')

        # 2. Measurable impact
        if not _METRIC_RE.search(text):
            issues.append("No measurable impact — add a number or percentage")

        # 3. Too brief
        if len(text.split()) < 8:
            issues.append("Too brief — expand with context or outcome")

        # 4. Passive framing
        for pattern in _PASSIVE_PATTERNS:
            if pattern.match(text):
                issues.append("Passive framing — lead with what you did, not your role")
                break

        feedback.append(BulletFeedback(text=text, passed=len(issues) == 0, issues=issues))

    return feedback
