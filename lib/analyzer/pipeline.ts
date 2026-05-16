import type { AnalysisResult } from '@/types/analysis'
import { detectSections } from './sections'
import { tfidfScore, scoreSections, keywordGap } from './scorer'
import { extractSkills, compareSkills } from './skills'
import { auditBullets } from './bullets'

export async function runAnalysis(
  resumeText: string,
  jdText: string,
): Promise<AnalysisResult> {
  const sections = detectSections(resumeText)

  const overallScore = Math.round(tfidfScore(resumeText, jdText) * 100)
  const sectionScores = scoreSections(sections, jdText)
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
    createdAt: new Date().toISOString(),
  }
}
