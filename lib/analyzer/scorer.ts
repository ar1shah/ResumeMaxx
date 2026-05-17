// TF-IDF cosine similarity — hand-rolled so we can run it in a Vercel function
// without a Python sklearn dependency. Results are directionally correct for MVP
// scoring; see ROADMAP for a note on parity with sklearn's implementation.

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','up','about','into','through','during','is','are','was','were','be',
  'been','being','have','has','had','do','does','did','will','would','could',
  'should','may','might','that','this','these','those','it','its','as','not',
  'no','so','if','then','than','can','our','we','you','your','my','their','i',
  'me','him','her','us','them','who','what','when','where','how','which','all',
  'each','both','few','more','most','other','some','such','only','own','same',
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t))
}

function buildTF(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>()
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1)
  // Normalize by document length
  freq.forEach((v, k) => freq.set(k, v / tokens.length))
  return freq
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  // Clamp to [0,1] to handle floating-point noise
  return Math.min(1, dot / (Math.sqrt(normA) * Math.sqrt(normB)))
}

export function tfidfScore(docA: string, docB: string): number {
  const tokensA = tokenize(docA)
  const tokensB = tokenize(docB)
  const tfA = buildTF(tokensA)
  const tfB = buildTF(tokensB)

  const vocab = new Set([...tfA.keys(), ...tfB.keys()])

  // IDF over a two-document corpus: log(2 / df)
  const idf = new Map<string, number>()
  for (const term of vocab) {
    const df = (tfA.has(term) ? 1 : 0) + (tfB.has(term) ? 1 : 0)
    idf.set(term, Math.log(2 / df))
  }

  const vecA: number[] = []
  const vecB: number[] = []
  for (const term of vocab) {
    const w = idf.get(term) ?? 0
    vecA.push((tfA.get(term) ?? 0) * w)
    vecB.push((tfB.get(term) ?? 0) * w)
  }

  return cosine(vecA, vecB)
}

export function scoreSections(
  sections: Record<string, string>,
  referenceText: string,
): Array<{ section: string; score: number }> {
  return Object.entries(sections)
    .filter(([, content]) => content.trim().length > 20)
    .map(([section, content]) => ({
      section,
      score: Math.round(tfidfScore(content, referenceText) * 100),
    }))
    .sort((a, b) => b.score - a.score)
}

/**
 * Fraction of JD requirements TF-IDF mass that is covered by resume tokens,
 * in [0, 1]. Returns 0.5 (neutral) when inputs are empty.
 *
 * Uses the same hand-rolled TF-IDF as tfidfScore but measures coverage
 * (how much of the JD's term mass does the resume address?) rather than
 * symmetric cosine similarity.
 */
export function requirementsCoverage(
  resumeText: string,
  requirementsText: string,
): number {
  if (!resumeText.trim() || !requirementsText.trim()) return 0.5

  const reqTokens = tokenize(requirementsText)
  const resumeTokens = tokenize(resumeText)
  const resumeSet = new Set(resumeTokens)

  // Build TF-IDF weights for requirements text only
  const reqTF = buildTF(reqTokens)

  // IDF computed over a two-doc corpus (requirements + resume) to match sklearn semantics
  const allVocab = new Set([...reqTokens, ...resumeTokens])
  const resumeTF = buildTF(resumeTokens)

  let totalMass = 0
  let coveredMass = 0

  for (const term of allVocab) {
    const df = (reqTF.has(term) ? 1 : 0) + (resumeTF.has(term) ? 1 : 0)
    const idf = Math.log(2 / df)
    const reqWeight = (reqTF.get(term) ?? 0) * idf

    totalMass += reqWeight
    if (resumeSet.has(term)) {
      coveredMass += reqWeight
    }
  }

  if (totalMass === 0) return 0.5
  return Math.min(1, coveredMass / totalMass)
}

export function keywordGap(resumeText: string, jdText: string): string[] {
  const resumeTokens = new Set(tokenize(resumeText))
  const jdTokens = tokenize(jdText)

  // Rank JD terms by raw frequency, then filter out those already in the resume
  const jdFreq = new Map<string, number>()
  for (const t of jdTokens) jdFreq.set(t, (jdFreq.get(t) ?? 0) + 1)

  return Array.from(jdFreq.entries())
    .filter(([term]) => !resumeTokens.has(term) && term.length > 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([term]) => term)
}
