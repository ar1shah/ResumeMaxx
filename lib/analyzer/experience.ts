// Years-of-experience extraction and alignment scoring.
// Pure regex — no external dependencies.

// Limit to 1-2 digit numbers to avoid matching calendar years (2021, 2019, etc.)
const RESUME_YEARS_RE = /\b(\d{1,2})\+?\s*(?:[-\u2013\u2014]|to)?\s*(\d{1,2})?\s*(?:\+)?\s+years?\b/gi
const JD_RANGE_RE = /(\d{1,2})\s*[-\u2013\u2014]\s*(\d{1,2})\s*\+?\s*years?\b/i
const JD_MIN_RE = /(?:minimum|at least|min\.?|>\s*)(\d{1,2})\+?\s*years?\b/i
const JD_PLUS_RE = /(\d{1,2})\+\s*years?\b/i
const JD_PLAIN_RE = /(\d{1,2})\s*years?\s*(?:of\b|experience\b)/i

export function extractResumeYears(resumeText: string): number | null {
  const matches = [...resumeText.matchAll(RESUME_YEARS_RE)]
  if (matches.length === 0) return null

  const years = matches.map(m => {
    const high = m[2] ? parseFloat(m[2]) : null
    const low = parseFloat(m[1])
    return high ?? low
  })

  return Math.max(...years)
}

export function extractJdYears(jdText: string): [number, number] | null {
  let m = JD_RANGE_RE.exec(jdText)
  if (m) return [parseFloat(m[1]), parseFloat(m[2])]

  m = JD_MIN_RE.exec(jdText)
  if (m) { const n = parseFloat(m[1]); return [n, n + 3] }

  m = JD_PLUS_RE.exec(jdText)
  if (m) { const n = parseFloat(m[1]); return [n, n + 3] }

  m = JD_PLAIN_RE.exec(jdText)
  if (m) { const n = parseFloat(m[1]); return [n, n + 3] }

  return null
}

export function experienceFitScore(resumeText: string, jdText: string): number {
  const resumeYears = extractResumeYears(resumeText)
  const jdRange = extractJdYears(jdText)

  if (resumeYears === null || jdRange === null) return 70

  const [minReq, maxReq] = jdRange

  if (resumeYears >= minReq) {
    return resumeYears <= maxReq + 5 ? 100 : 90
  }

  const gap = minReq - resumeYears
  if (gap <= 1) return 80
  if (gap <= 2) return 65
  return 45
}
