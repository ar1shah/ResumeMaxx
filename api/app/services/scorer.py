from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


def tfidf_score(doc_a: str, doc_b: str) -> float:
    """Cosine similarity between two documents using sklearn's TF-IDF.

    Using sklearn here (vs the hand-rolled TypeScript version) gives us the
    full sublinear TF smoothing and IDF calibrated across a larger corpus
    of stop-word-filtered terms, which produces better-calibrated scores.
    """
    if not doc_a.strip() or not doc_b.strip():
        return 0.0

    vectorizer = TfidfVectorizer(
        lowercase=True,
        strip_accents="unicode",
        stop_words="english",
        ngram_range=(1, 1),
        sublinear_tf=True,
        min_df=1,
    )
    try:
        tfidf = vectorizer.fit_transform([doc_a, doc_b])
        score = float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])
    except ValueError:
        # sklearn raises this when stop-word filtering leaves an empty vocabulary
        return 0.0
    return max(0.0, min(1.0, score))


def score_sections(sections: dict[str, str], jd_text: str) -> list[dict]:
    """Score each detected resume section against a reference text (usually requirements)."""
    results = []
    for section, content in sections.items():
        if len(content.strip()) < 20:
            continue
        score = round(tfidf_score(content, jd_text) * 100)
        results.append({"section": section, "score": score})
    return sorted(results, key=lambda x: x["score"], reverse=True)


def requirements_coverage(resume_text: str, requirements_text: str) -> float:
    """Fraction of JD requirements TF-IDF mass that is covered by resume tokens.

    Unlike symmetric cosine similarity, this metric asks: "how much of what the
    job demands does the resume address?" — a better proxy for recruiter fit.

    Returns a value in [0, 1]. Returns 0.5 (neutral) on empty inputs so the
    composite score is not dragged down when requirements can't be extracted.
    """
    if not requirements_text.strip() or not resume_text.strip():
        return 0.5

    vectorizer = TfidfVectorizer(
        lowercase=True,
        strip_accents="unicode",
        stop_words="english",
        ngram_range=(1, 1),
        sublinear_tf=True,
        min_df=1,
    )
    try:
        vectorizer.fit([requirements_text])
        jd_vec: np.ndarray = vectorizer.transform([requirements_text]).toarray()[0]
        resume_vec: np.ndarray = vectorizer.transform([resume_text]).toarray()[0]
    except ValueError:
        return 0.5

    total_mass = float(jd_vec.sum())
    if total_mass == 0:
        return 0.5

    # Sum JD term weights where the resume also has a non-zero score for that term
    covered_mass = float(np.sum(jd_vec[resume_vec > 0]))
    return min(1.0, covered_mass / total_mass)


def keyword_gap(resume_text: str, jd_text: str) -> list[str]:
    """Return high-frequency JD terms absent from the resume, ranked by importance.

    We fit TF-IDF on the JD alone to rank its terms, then filter out any that
    appear (case-insensitively) in the resume text.
    """
    if not jd_text.strip():
        return []

    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 1),
        min_df=1,
    )
    try:
        vectorizer.fit([jd_text])
        terms = vectorizer.get_feature_names_out()
        scores = vectorizer.transform([jd_text]).toarray()[0]
    except ValueError:
        return []

    resume_lower = resume_text.lower()
    missing = [
        term for term, score in sorted(zip(terms, scores), key=lambda x: -x[1])
        if len(term) > 3 and term not in resume_lower
    ]
    return missing[:30]
