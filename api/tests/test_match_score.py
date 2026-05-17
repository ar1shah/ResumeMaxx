"""Calibration tests for the composite match score.

These tests use golden fixtures (data/fixtures/scoring-golden.json) to assert
that the scoring algorithm produces scores within expected human-judged ranges.
They also serve as regression guards — if the weights or algorithms change and
a golden case drifts out of range, these tests will catch it.
"""
import json
from pathlib import Path

import pytest

from app.services.match_score import compute_match_score
from app.services.jd_extract import extract_jd
from app.services.sections import detect_sections
from app.services.experience import (
    extract_resume_years,
    extract_jd_years,
    experience_fit_score,
)
from app.services.skills import classify_jd_skills, compute_skill_fit

_FIXTURES_PATH = (
    Path(__file__).resolve().parent.parent.parent / "data" / "fixtures" / "scoring-golden.json"
)


def _load_fixtures() -> list[dict]:
    return json.loads(_FIXTURES_PATH.read_text(encoding="utf-8"))["fixtures"]


# ---------------------------------------------------------------------------
# Golden fixture range tests
# ---------------------------------------------------------------------------

class TestGoldenFixtures:
    """Each fixture asserts score lands in the expected human-judged range."""

    @pytest.mark.parametrize("fixture", _load_fixtures())
    def test_score_in_expected_range(self, fixture: dict):
        resume = fixture["resume"]
        jd = fixture["jd"]
        sections = detect_sections(resume)
        score, breakdown = compute_match_score(resume, jd, sections)

        assert fixture["expected_min"] <= score <= fixture["expected_max"], (
            f"[{fixture['id']}] score={score} not in "
            f"[{fixture['expected_min']}, {fixture['expected_max']}]. "
            f"Breakdown: skill_fit={breakdown.skill_fit}, "
            f"lexical={breakdown.lexical_coverage}, "
            f"exp={breakdown.experience_fit}, "
            f"section={breakdown.section_relevance}"
        )

    def test_strong_match_beats_weak_match(self):
        fixtures = {f["id"]: f for f in _load_fixtures()}
        strong = fixtures["strong_match"]
        weak = fixtures["weak_match"]

        def score(f: dict) -> int:
            secs = detect_sections(f["resume"])
            s, _ = compute_match_score(f["resume"], f["jd"], secs)
            return s

        assert score(strong) > score(weak) + 20, (
            "Strong match should score at least 20 points above unrelated pair"
        )


# ---------------------------------------------------------------------------
# JD extraction unit tests
# ---------------------------------------------------------------------------

class TestJdExtract:
    def test_structured_jd_splits_sections(self):
        jd = (
            "Requirements\n"
            "- Python and Node.js\n"
            "- 3-5 years experience\n"
            "Nice to Have\n"
            "- GraphQL\n"
            "- Kubernetes\n"
            "Benefits\n"
            "- Health insurance\n"
            "- Unlimited PTO\n"
        )
        result = extract_jd(jd)
        assert "python" in result.requirements_text.lower()
        assert "graphql" in result.nice_to_have_text.lower()
        assert "insurance" not in result.requirements_text.lower()
        assert "insurance" not in result.nice_to_have_text.lower()

    def test_unstructured_jd_uses_full_text(self):
        jd = "We need a Python developer with AWS experience."
        result = extract_jd(jd)
        assert "python" in result.requirements_text.lower()
        assert "aws" in result.requirements_text.lower()

    def test_noise_stripped_from_full_text(self):
        jd = (
            "Requirements\n"
            "Python skills required\n"
            "Benefits\n"
            "Competitive salary and health insurance\n"
        )
        result = extract_jd(jd)
        assert "insurance" not in result.full_text.lower()


# ---------------------------------------------------------------------------
# Experience alignment tests
# ---------------------------------------------------------------------------

class TestExperience:
    def test_resume_years_extraction(self):
        text = "I have 4 years of experience building web applications."
        assert extract_resume_years(text) == 4.0

    def test_resume_years_takes_maximum(self):
        text = "2 years at Company A, then 3 years at Company B."
        assert extract_resume_years(text) == 3.0

    def test_jd_range_extraction(self):
        text = "Requires 3-5 years of professional experience."
        assert extract_jd_years(text) == (3.0, 5.0)

    def test_jd_plus_extraction(self):
        text = "5+ years required."
        result = extract_jd_years(text)
        assert result is not None
        assert result[0] == 5.0

    def test_experience_fit_in_range(self):
        assert experience_fit_score(
            "Engineer with 4 years of experience",
            "Requires 3-5 years",
        ) == 100.0

    def test_experience_fit_one_year_short(self):
        score = experience_fit_score(
            "Engineer with 2 years of experience",
            "Requires 3-5 years",
        )
        assert score == 80.0

    def test_experience_fit_no_signal(self):
        score = experience_fit_score("Software engineer", "Great role")
        assert score == 70.0  # neutral


# ---------------------------------------------------------------------------
# Skill fit tests
# ---------------------------------------------------------------------------

class TestSkillFit:
    def test_all_required_matched(self):
        jd = "Requirements\nPython, Node.js, React, PostgreSQL, Docker"
        classified = classify_jd_skills(jd)
        resume = "Python Node.js React PostgreSQL Docker AWS"
        score = compute_skill_fit(resume, classified)
        assert score >= 90

    def test_nice_to_have_gap_partial_penalty(self):
        jd = "Requirements\nPython, React\nNice to Have\nGraphQL, Kubernetes"
        classified = classify_jd_skills(jd)
        assert "graphql" in classified.nice_to_have or "kubernetes" in classified.nice_to_have

        resume_full = "Python React GraphQL Kubernetes"
        resume_partial = "Python React"

        full_score = compute_skill_fit(resume_full, classified)
        partial_score = compute_skill_fit(resume_partial, classified)
        assert full_score > partial_score

    def test_no_jd_skills_returns_neutral(self):
        from app.services.skills import ClassifiedJdSkills
        score = compute_skill_fit("Python developer", ClassifiedJdSkills(required=[], nice_to_have=[]))
        assert score == 70.0
