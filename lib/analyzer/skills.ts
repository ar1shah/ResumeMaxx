import { readFileSync } from 'fs'
import path from 'path'
import { extractJd } from './jd-extract'

let _vocab: Set<string> | null = null

function loadVocab(): Set<string> {
  if (_vocab) return _vocab
  const filePath = path.join(process.cwd(), 'data', 'skills_vocabulary.txt')
  const raw = readFileSync(filePath, 'utf-8')
  _vocab = new Set(
    raw.split('\n').map(l => l.trim().toLowerCase()).filter(Boolean),
  )
  return _vocab
}

export function extractSkills(text: string): string[] {
  const vocab = loadVocab()
  const lower = text.toLowerCase()
  const found: string[] = []

  for (const skill of vocab) {
    // Word-boundary check: the skill must appear as a standalone token
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`)
    if (re.test(lower)) found.push(skill)
  }

  return found
}

export function compareSkills(
  resumeText: string,
  jdText: string,
): { matched: string[]; missing: string[] } {
  const resumeSkills = new Set(extractSkills(resumeText))
  const jdSkills = extractSkills(jdText)

  const matched = jdSkills.filter(s => resumeSkills.has(s))
  const missing = jdSkills.filter(s => !resumeSkills.has(s))

  return { matched, missing }
}

export interface ClassifiedJdSkills {
  required: string[]
  niceToHave: string[]
}

export function classifyJdSkills(jdText: string): ClassifiedJdSkills {
  const jdExtract = extractJd(jdText)
  const reqSkills = new Set(extractSkills(jdExtract.requirementsText))
  const niceFromSection = new Set(
    extractSkills(jdExtract.niceToHaveText).filter(s => !reqSkills.has(s)),
  )

  // Skills in the full JD not placed in either bucket → required (conservative)
  const fullSkills = extractSkills(jdExtract.fullText)
  const extraReq = fullSkills.filter(s => !reqSkills.has(s) && !niceFromSection.has(s))

  return {
    required: [...new Set([...reqSkills, ...extraReq])].sort(),
    niceToHave: [...niceFromSection].sort(),
  }
}

export function computeSkillFit(
  resumeText: string,
  classified: ClassifiedJdSkills,
): number {
  const resumeSkills = new Set(extractSkills(resumeText))
  const { required, niceToHave } = classified

  if (required.length === 0 && niceToHave.length === 0) {
    return 70 // neutral: JD has no detectable skills
  }

  const reqMatched = required.filter(s => resumeSkills.has(s)).length
  const niceMatched = niceToHave.filter(s => resumeSkills.has(s)).length

  const numerator = reqMatched + 0.5 * niceMatched
  const denominator = required.length + 0.5 * niceToHave.length

  return Math.min(100, Math.round((numerator / denominator) * 100))
}
