from app.services.scorer import tfidf_score, keyword_gap, score_sections


def test_identical_docs_score_one():
    text = "software engineer python react typescript docker kubernetes"
    assert tfidf_score(text, text) == 1.0


def test_empty_doc_scores_zero():
    assert tfidf_score("", "some text") == 0.0
    assert tfidf_score("some text", "") == 0.0


def test_unrelated_docs_score_low():
    score = tfidf_score(
        "baking sourdough bread yeast flour water",
        "python machine learning neural network tensorflow",
    )
    assert score < 0.1


def test_related_docs_score_higher_than_unrelated():
    resume = "python developer with experience in django fastapi rest apis postgresql"
    jd = "senior python engineer fastapi postgresql docker aws"
    unrelated = "chef preparing french cuisine baking pastry"
    assert tfidf_score(resume, jd) > tfidf_score(resume, unrelated)


def test_keyword_gap_returns_missing_terms():
    resume = "python django postgresql git"
    jd = "python fastapi kubernetes docker redis postgresql monitoring"
    missing = keyword_gap(resume, jd)
    assert "fastapi" in missing or "kubernetes" in missing or "docker" in missing
    assert "python" not in missing   # already in resume
    assert "postgresql" not in missing


def test_keyword_gap_empty_jd():
    assert keyword_gap("some resume text", "") == []


def test_score_sections_filters_short():
    sections = {
        "summary": "x",   # too short — should be excluded
        "experience": "developed and shipped python services using fastapi and docker on aws kubernetes",
    }
    results = score_sections(sections, "python fastapi docker kubernetes aws")
    sections_names = [r["section"] for r in results]
    assert "experience" in sections_names
    assert "summary" not in sections_names
