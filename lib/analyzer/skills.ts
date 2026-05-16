import { readFileSync } from 'fs'
import path from 'path'

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
