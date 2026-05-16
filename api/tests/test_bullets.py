from app.services.bullets import audit_bullets


def test_strong_bullet_passes():
    text = "- Developed and shipped 3 new React features used by 50,000 users, reducing churn by 12%"
    feedback = audit_bullets(text)
    assert len(feedback) == 1
    assert feedback[0].passed is True
    assert feedback[0].issues == []


def test_no_action_verb_flagged():
    text = "- Responsible for maintaining the CI/CD pipeline across 5 services"
    feedback = audit_bullets(text)
    assert any("action verb" in i.lower() or "passive" in i.lower() for i in feedback[0].issues)


def test_no_metric_flagged():
    text = "- Developed backend services using Python and FastAPI for the platform"
    feedback = audit_bullets(text)
    assert any("measurable" in i.lower() or "number" in i.lower() for i in feedback[0].issues)


def test_too_brief_flagged():
    text = "- Built the app"
    feedback = audit_bullets(text)
    assert any("brief" in i.lower() for i in feedback[0].issues)


def test_passive_framing_flagged():
    text = "- Was responsible for reviewing pull requests and code quality across the team"
    feedback = audit_bullets(text)
    assert any("passive" in i.lower() for i in feedback[0].issues)


def test_empty_experience_returns_empty():
    assert audit_bullets("") == []
    assert audit_bullets("   \n\n   ") == []


def test_multiple_bullets():
    text = (
        "- Architected and deployed microservices handling 1M+ requests per day on AWS\n"
        "- Helped with documentation updates\n"
        "- Reduced API latency by 40% through query optimization and Redis caching"
    )
    feedback = audit_bullets(text)
    assert len(feedback) == 3
    passed = [f for f in feedback if f.passed]
    failed = [f for f in feedback if not f.passed]
    assert len(passed) >= 1
    assert len(failed) >= 1
