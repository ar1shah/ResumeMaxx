from app.models.schemas import AnalysisResult, SectionScore
from app.services.sections import detect_sections
from app.services.scorer import keyword_gap, score_sections
from app.services.skills import extract_skills, compare_skills
from app.services.bullets import audit_bullets
from app.services.jd_extract import extract_jd
from app.services.match_score import compute_match_score


def run_analysis(resume_text: str, jd_text: str) -> AnalysisResult:
    sections = detect_sections(resume_text)
    jd_extract = extract_jd(jd_text)
    req_text = jd_extract.requirements_text

    overall_score, breakdown = compute_match_score(resume_text, jd_text, sections)

    # Per-section scores for the chart — scored against requirements text
    raw_section_scores = score_sections(sections, req_text)

    missing_keywords = keyword_gap(resume_text, jd_text)
    matched_skills, missing_skills = compare_skills(resume_text, jd_text)
    resume_skill_count = len(extract_skills(resume_text))
    jd_skill_count = len(extract_skills(jd_text))

    experience_text = sections.get("experience") or sections.get("other") or resume_text
    bullet_feedback = audit_bullets(experience_text)

    return AnalysisResult(
        overall_score=overall_score,
        section_scores=[
            SectionScore(section=s["section"], score=float(s["score"]))
            for s in raw_section_scores
        ],
        missing_keywords=missing_keywords,
        bullet_feedback=bullet_feedback,
        resume_skill_count=resume_skill_count,
        jd_skill_count=jd_skill_count,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        score_breakdown={
            "skillFit": breakdown.skill_fit,
            "lexicalCoverage": breakdown.lexical_coverage,
            "experienceFit": breakdown.experience_fit,
            "sectionRelevance": breakdown.section_relevance,
        },
    )
