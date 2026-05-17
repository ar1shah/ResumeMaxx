import { extractJd } from './jd-extract'
import { classifyJdSkills, computeSkillFit } from './skills'
import { requirementsCoverage, scoreSections } from './scorer'
import { experienceFitScore } from './experience'

// Composite component weights — must sum to 1.0
const W_SKILL = 0.40
const W_LEXICAL = 0.30
const W_EXPERIENCE = 0.15
const W_SECTION = 0.15

const SECTION_WEIGHTS: Record<string, number> = {
  experience: 2.0,
  skills: 1.5,
  summary: 1.0,
  projects: 1.0,
  certifications: 0.75,
}
const DEFAULT_SECTION_WEIGHT = 0.75

export interface ScoreBreakdown {
  skillFit: number
  lexicalCoverage: number
  experienceFit: number
  sectionRelevance: number
}

function weightedSectionScore(
  sections: Record<string, string>,
  requirementsText: string,
): number {
  const sectionScores = scoreSections(sections, requirementsText)
  if (sectionScores.length === 0) return 50

  let totalWeight = 0
  let weightedSum = 0
  for (const s of sectionScores) {
    const w = SECTION_WEIGHTS[s.section] ?? DEFAULT_SECTION_WEIGHT
    weightedSum += w * s.score
    totalWeight += w
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 50
}

export function computeMatchScore(
  resumeText: string,
  jdText: string,
  sections: Record<string, string>,
): { overallScore: number; breakdown: ScoreBreakdown } {
  const jdExtract = extractJd(jdText)
  const reqText = jdExtract.requirementsText

  const classified = classifyJdSkills(jdText)
  const skillFit = computeSkillFit(resumeText, classified)

  const cov = requirementsCoverage(resumeText, reqText)
  // Calibration: coverage * 120 capped at 100, so ~0.70 coverage → 84.
  const lexical = Math.min(100, cov * 120)

  const expFit = experienceFitScore(resumeText, jdText)

  const secRel = weightedSectionScore(sections, reqText)

  const overall = Math.min(100, Math.max(0, Math.round(
    W_SKILL * skillFit
    + W_LEXICAL * lexical
    + W_EXPERIENCE * expFit
    + W_SECTION * secRel,
  )))

  return {
    overallScore: overall,
    breakdown: {
      skillFit: Math.round(skillFit * 10) / 10,
      lexicalCoverage: Math.round(lexical * 10) / 10,
      experienceFit: Math.round(expFit * 10) / 10,
      sectionRelevance: Math.round(secRel * 10) / 10,
    },
  }
}
