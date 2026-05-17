import re
from pathlib import Path
from functools import lru_cache

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
