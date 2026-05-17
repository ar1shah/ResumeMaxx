from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


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
    """Score each detected resume section against the full job description."""
    results = []
    for section, content in sections.items():
        if len(content.strip()) < 20:
            continue
        score = round(tfidf_score(content, jd_text) * 100)
        results.append({"section": section, "score": score})
    return sorted(results, key=lambda x: x["score"], reverse=True)


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
