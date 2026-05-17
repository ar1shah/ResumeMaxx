import type { AnalysisResult } from '@/types/analysis'
import { detectSections } from './sections'
import { extractJd } from './jd-extract'
import { scoreSections, keywordGap } from './scorer'
import { extractSkills, compareSkills } from './skills'
import { auditBullets } from './bullets'
import { computeMatchScore } from './match-score'

export async function runAnalysis(
  resumeText: string,
  jdText: string,
): Promise<AnalysisResult> {
  const sections = detectSections(resumeText)
  const jdExtract = extractJd(jdText)
  const reqText = jdExtract.requirementsText

  const { overallScore, breakdown } = computeMatchScore(resumeText, jdText, sections)

  // Per-section scores for the chart — scored against requirements text
  const sectionScores = scoreSections(sections, reqText)

  const missingKeywords = keywordGap(resumeText, jdText)

  const { matched: matchedSkills, missing: missingSkills } = compareSkills(resumeText, jdText)
  const resumeSkillCount = extractSkills(resumeText).length
  const jdSkillCount = extractSkills(jdText).length

  const experienceText = sections.experience ?? sections.other ?? resumeText
  const bulletFeedback = auditBullets(experienceText)

  return {
    overallScore,
    sectionScores,
    missingKeywords,
    bulletFeedback,
    resumeSkillCount,
    jdSkillCount,
    matchedSkills,
    missingSkills,
    scoreBreakdown: breakdown,
    createdAt: new Date().toISOString(),
  }
}
