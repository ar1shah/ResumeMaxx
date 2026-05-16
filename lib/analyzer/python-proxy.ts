import type { AnalysisResult } from '@/types/analysis'

const BASE_URL = process.env.PYTHON_API_URL!
const SECRET = process.env.PYTHON_API_SECRET ?? ''

/**
 * Forward an analysis request to the Python FastAPI service.
 * Accepts either multipart FormData (PDF upload path) or a JSON body
 * (paste path) and returns the parsed AnalysisResult.
 */
export async function proxyToPython(
  body: FormData | { resumeText: string; jdText: string },
): Promise<AnalysisResult> {
  const headers: Record<string, string> = {}
  if (SECRET) {
    headers['x-api-secret'] = SECRET
  }

  let fetchBody: BodyInit
  if (body instanceof FormData) {
    // Let fetch set Content-Type with the correct boundary
    fetchBody = body
  } else {
    // Python route accepts both JSON and form; we use multipart form here
    // to keep a single code path on the Python side.
    const form = new FormData()
    form.append('resumeText', body.resumeText)
    form.append('jdText', body.jdText)
    fetchBody = form
  }

  const res = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers,
    body: fetchBody,
    // 25s — gives Python time to cold-start spaCy on Railway free tier
    signal: AbortSignal.timeout(25_000),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      (err as { detail?: string }).detail ?? `Python API error ${res.status}`,
    )
  }

  return res.json() as Promise<AnalysisResult>
}
