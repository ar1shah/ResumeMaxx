export interface BulletFeedback {
  text: string
  passed: boolean
  issues: string[]
}

export interface SectionScore {
  section: string
  score: number
}

export interface AnalysisResult {
  overallScore: number
  sectionScores: SectionScore[]
  missingKeywords: string[]
  bulletFeedback: BulletFeedback[]
  resumeSkillCount: number
  jdSkillCount: number
  matchedSkills: string[]
  missingSkills: string[]
  createdAt: string
}

// Stored in localStorage under "resumemaxx:history".
// Server-side persistence is a Phase 2 feature.
export interface HistoryEntry {
  id: string
  createdAt: string
  snippet: string
  result: AnalysisResult
}
