// Parses a job description into requirements, nice-to-have, and noise-stripped text.
// Pure regex — no external dependencies, safe for Vercel Edge.

export interface JdExtract {
  requirementsText: string
  niceToHaveText: string
  fullText: string // noise-stripped; fallback when sections are not detected
}

const REQUIREMENTS_RE =
  /^(requirements?|qualifications?|must[- ]?have|required skills?|what you['`]?ll? (need|bring)|you (have|bring|must have)|minimum qualifications?|basic qualifications?|responsibilities and requirements?|skills (required|needed)|key requirements?)\s*:?$/im

const NICE_RE =
  /^(preferred|nice[- ]to[- ]have|bonus|a plus|bonuses|preferred qualifications?|additional qualifications?|would be (great|a plus|a bonus|nice)|it['`]?s a (plus|bonus)|pluses?|ideally)\s*:?$/im

const NOISE_RE =
  /^(about (us|the company|our company|the team|the role)|who we are|our (story|mission|values?|culture|vision)|benefits?|perks?|compensation|salary range?|total rewards?|pay range?|equal opportunity|eeo statement?|diversity (&|and) inclusion|how to apply|application (process|instructions?)|why (join|work for|work at)|what we offer|about this role)\s*:?$/im

const INLINE_NICE_RE =
  /\b(preferred|nice[- ]to[- ]have|bonus|a plus|ideally|advantageous|it['`]?s? a (plus|bonus))\b/i

type SectionType = 'required' | 'nice' | 'noise' | 'other'

export function extractJd(jdText: string): JdExtract {
  const lines = jdText.split('\n')
  let current: SectionType = 'other'

  const reqLines: string[] = []
  const niceLines: string[] = []
  const fullLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (REQUIREMENTS_RE.test(trimmed)) {
      current = 'required'
      continue
    }
    if (NICE_RE.test(trimmed)) {
      current = 'nice'
      continue
    }
    if (NOISE_RE.test(trimmed)) {
      current = 'noise'
      continue
    }

    if (current === 'noise') continue

    fullLines.push(line)

    if (current === 'required') {
      if (INLINE_NICE_RE.test(trimmed)) {
        niceLines.push(line)
      } else {
        reqLines.push(line)
      }
    } else if (current === 'nice') {
      niceLines.push(line)
    } else {
      // 'other' — treat as requirements (compact/unstructured JDs)
      reqLines.push(line)
    }
  }

  const requirementsText = reqLines.join('\n').trim()
  const niceToHaveText = niceLines.join('\n').trim()
  const fullText = fullLines.join('\n').trim()

  return {
    requirementsText: requirementsText || fullText,
    niceToHaveText,
    fullText: fullText || jdText.trim(),
  }
}
