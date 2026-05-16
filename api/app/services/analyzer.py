from app.models.schemas import AnalysisResult, SectionScore
from app.services.sections import detect_sections
from app.services.scorer import tfidf_score, score_sections, keyword_gap
from app.services.skills import extract_skills, compare_skills
from app.services.bullets import audit_bullets


def run_analysis(resume_text: str, jd_text: str) -> AnalysisResult:
    sections = detect_sections(resume_text)

    overall_score = round(tfidf_score(resume_text, jd_text) * 100)
    raw_section_scores = score_sections(sections, jd_text)
    missing_keywords = keyword_gap(resume_text, jd_text)

    matched_skills, missing_skills = compare_skills(resume_text, jd_text)
    resume_skill_count = len(extract_skills(resume_text))
    jd_skill_count = len(extract_skills(jd_text))

    experience_text = sections.get("experience") or sections.get("other") or resume_text
    bullet_feedback = audit_bullets(experience_text)

    return AnalysisResult(
        **{
            "overallScore": overall_score,
            "sectionScores": [SectionScore(**{"section": s["section"], "score": s["score"]}) for s in raw_section_scores],
            "missingKeywords": missing_keywords,
            "bulletFeedback": bullet_feedback,
            "resumeSkillCount": resume_skill_count,
            "jdSkillCount": jd_skill_count,
            "matchedSkills": matched_skills,
            "missingSkills": missing_skills,
        }
    )
