// Section headers are often ALL CAPS, Title Case, or followed by a colon.
// We match at the start of a line and allow an optional colon/dash suffix.
const SECTION_PATTERNS: Array<{ key: string; regex: RegExp }> = [
  { key: 'summary',          regex: /^(summary|profile|objective|about|professional summary|career objective)\s*:?$/im },
  { key: 'experience',       regex: /^(experience|work experience|employment|professional experience|work history|career history)\s*:?$/im },
  { key: 'education',        regex: /^(education|academic background|academic history|degrees?|schooling|qualifications)\s*:?$/im },
  { key: 'skills',           regex: /^(skills|technical skills|core competencies|technologies|expertise|proficiencies)\s*:?$/im },
  { key: 'projects',         regex: /^(projects|project experience|portfolio|personal projects|side projects|open.?source)\s*:?$/im },
  { key: 'certifications',   regex: /^(certifications?|licenses?|credentials|accreditations?|professional development)\s*:?$/im },
  { key: 'awards',           regex: /^(awards?|honors?|achievements?|recognition)\s*:?$/im },
  { key: 'publications',     regex: /^(publications?|research|papers?|articles?)\s*:?$/im },
]

export function detectSections(text: string): Record<string, string> {
  const lines = text.split('\n')
  const sections: Record<string, string> = {}
  let currentKey = 'other'
  const buffers: Record<string, string[]> = { other: [] }

  for (const line of lines) {
    const trimmed = line.trim()
    const match = SECTION_PATTERNS.find(({ regex }) => regex.test(trimmed))

    if (match) {
      currentKey = match.key
      buffers[currentKey] ??= []
    } else {
      buffers[currentKey] ??= []
      buffers[currentKey].push(line)
    }
  }

  for (const [key, lines] of Object.entries(buffers)) {
    const content = lines.join('\n').trim()
    if (content) sections[key] = content
  }

  return sections
}
