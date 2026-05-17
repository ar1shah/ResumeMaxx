from datetime import datetime, timezone
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class BulletFeedback(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    text: str
    passed: bool
    issues: list[str]


class SectionScore(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    section: str
    score: float


class AnalysisResult(BaseModel):
    """Response shape — camelCase aliases match the TypeScript contract in types/analysis.ts."""

    model_config = ConfigDict(populate_by_name=True)

    overall_score: float = Field(alias="overallScore")
    section_scores: list[SectionScore] = Field(alias="sectionScores")
    missing_keywords: list[str] = Field(alias="missingKeywords")
    bullet_feedback: list[BulletFeedback] = Field(alias="bulletFeedback")
    resume_skill_count: int = Field(alias="resumeSkillCount")
    jd_skill_count: int = Field(alias="jdSkillCount")
    matched_skills: list[str] = Field(alias="matchedSkills")
    missing_skills: list[str] = Field(alias="missingSkills")
    score_breakdown: dict[str, Any] | None = Field(default=None, alias="scoreBreakdown")
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        alias="createdAt",
    )

    def api_dict(self) -> dict:
        """Serialize with camelCase keys for JSON responses."""
        return self.model_dump(by_alias=True)
