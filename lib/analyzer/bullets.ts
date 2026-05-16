import { readFileSync } from 'fs'
import path from 'path'
import type { BulletFeedback } from '@/types/analysis'

let _verbs: Set<string> | null = null

function loadVerbs(): Set<string> {
  if (_verbs) return _verbs
  const filePath = path.join(process.cwd(), 'data', 'action_verbs.txt')
  const raw = readFileSync(filePath, 'utf-8')
  _verbs = new Set(
    raw.split('\n').map(l => l.trim().toLowerCase()).filter(Boolean),
  )
  return _verbs
}

// Passive / weak openings that signal a bullet needs rewording
const PASSIVE_PATTERNS = [
  /^was responsible for/i,
  /^responsible for/i,
  /^helped (with|to)/i,
  /^assisted (with|in)/i,
  /^worked on/i,
  /^participated in/i,
  /^involved in/i,
  /^duties included/i,
  /^tasked with/i,
]

// Metrics: numbers, percentages, dollar amounts, multipliers
const METRIC_RE = /\b\d[\d,.]*\s*(%|x|×|times|k|m|b|million|billion|\$|dollars?|usd)\b|\$[\d,.]+|\b\d{2,}\b/i

export function auditBullets(experienceText: string): BulletFeedback[] {
  const verbs = loadVerbs()

  // Split on lines that start with a bullet marker or are non-empty after trimming
  const lines = experienceText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  // Keep only lines that look like bullets (start with marker or are long enough)
  const bulletLines = lines.filter(l =>
    /^[•\-\*\u2022\u2013]/.test(l) || l.split(/\s+/).length >= 5,
  )

  if (bulletLines.length === 0) return []

  return bulletLines.map((raw): BulletFeedback => {
    const text = raw.replace(/^[•\-\*\u2022\u2013]\s*/, '')
    const issues: string[] = []

    // 1. Strong action verb check
    const firstWord = text.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
    if (firstWord && !verbs.has(firstWord)) {
      issues.push(`Starts with "${firstWord}" — consider a strong action verb`)
    }

    // 2. Metrics check
    if (!METRIC_RE.test(text)) {
      issues.push('No measurable impact — add a number or percentage')
    }

    // 3. Length check (fewer than 8 words is usually too vague)
    const wordCount = text.split(/\s+/).filter(Boolean).length
    if (wordCount < 8) {
      issues.push('Too brief — expand with context or outcome')
    }

    // 4. Passive / weak framing
    const passiveMatch = PASSIVE_PATTERNS.find(p => p.test(text))
    if (passiveMatch) {
      issues.push('Passive framing — lead with what you did, not your role')
    }

    return { text, passed: issues.length === 0, issues }
  })
}
