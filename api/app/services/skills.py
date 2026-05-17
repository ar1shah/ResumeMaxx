import re
from dataclasses import dataclass
from pathlib import Path
from functools import lru_cache

from app.services.jd_extract import extract_jd

# spaCy is used to enrich skill extraction: noun chunks and named entities
# that match our vocabulary are added even if the exact string isn't present.
# We import lazily so the service can still start without the model downloaded
# (model is baked into the Docker image; local dev requires: python -m spacy download en_core_web_sm).
try:
    import spacy
    _NLP = spacy.load("en_core_web_sm")
except Exception:
    _NLP = None


_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


@lru_cache(maxsize=1)
def _load_vocab() -> frozenset[str]:
    vocab_path = _DATA_DIR / "skills_vocabulary.txt"
    return frozenset(
        line.strip().lower()
        for line in vocab_path.read_text().splitlines()
        if line.strip()
    )


def _direct_match(text: str, vocab: frozenset[str]) -> set[str]:
    """Case-insensitive word-boundary match for each vocab term."""
    lower = text.lower()
    found: set[str] = set()
    for skill in vocab:
        escaped = re.escape(skill)
        if re.search(rf"(?<![a-z0-9]){escaped}(?![a-z0-9])", lower):
            found.add(skill)
    return found


def _spacy_match(text: str, vocab: frozenset[str]) -> set[str]:
    """Use spaCy noun chunks + entities to catch additional skill mentions."""
    if _NLP is None:
        return set()
    doc = _NLP(text[:100_000])  # spaCy has a character limit
    candidates: set[str] = set()
    for chunk in doc.noun_chunks:
        candidates.add(chunk.text.lower().strip())
    for ent in doc.ents:
        candidates.add(ent.text.lower().strip())
    return {c for c in candidates if c in vocab}


def extract_skills(text: str) -> list[str]:
    vocab = _load_vocab()
    found = _direct_match(text, vocab) | _spacy_match(text, vocab)
    return sorted(found)


def compare_skills(resume_text: str, jd_text: str) -> tuple[list[str], list[str]]:
    resume_skills = set(extract_skills(resume_text))
    jd_skills = extract_skills(jd_text)
    matched = [s for s in jd_skills if s in resume_skills]
    missing = [s for s in jd_skills if s not in resume_skills]
    return matched, missing


@dataclass
class ClassifiedJdSkills:
    required: list[str]
    nice_to_have: list[str]


def classify_jd_skills(jd_text: str) -> ClassifiedJdSkills:
    """Classify JD skills as required or nice-to-have using section context.

    Skills found in both sections are treated as required (conservative).
    Skills found only in the full JD (not in any classified section) are
    treated as required.
    """
    jd_extract = extract_jd(jd_text)
    req_skills = set(extract_skills(jd_extract.requirements_text))
    nice_skills = set(extract_skills(jd_extract.nice_to_have_text)) - req_skills

    # Skills in the full JD but not in nice-to-have → required
    full_skills = set(extract_skills(jd_extract.full_text))
    extra_req = full_skills - req_skills - nice_skills

    return ClassifiedJdSkills(
        required=sorted(req_skills | extra_req),
        nice_to_have=sorted(nice_skills),
    )


def compute_skill_fit(resume_text: str, classified: ClassifiedJdSkills) -> float:
    """Weighted skill fit score in [0, 100].

    Formula:
        fit = (required_matched + 0.5 * nice_matched)
              / max(1, required_total + 0.5 * nice_total) * 100

    Missing a required skill costs a full point; missing a nice-to-have costs
    half a point, since they are not dealbreakers.
    Returns 70.0 (neutral) when the JD contains no detectable skills.
    """
    resume_skills = set(extract_skills(resume_text))
    required = classified.required
    nice = classified.nice_to_have

    if not required and not nice:
        return 70.0

    req_matched = sum(1 for s in required if s in resume_skills)
    nice_matched = sum(1 for s in nice if s in resume_skills)

    numerator = req_matched + 0.5 * nice_matched
    denominator = len(required) + 0.5 * len(nice)

    return round(min(100.0, (numerator / denominator) * 100), 2)
