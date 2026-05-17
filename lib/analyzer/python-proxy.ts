import type { AnalysisResult } from '@/types/analysis'

function baseUrl(): string {
  return (process.env.PYTHON_API_URL ?? '').replace(/\/$/, '')
}

function parseErrorBody(body: unknown, status: number): string {
  if (!body || typeof body !== 'object') return `Analysis service error (${status})`
  const b = body as { detail?: unknown; error?: string }
  if (typeof b.error === 'string') return b.error
  if (typeof b.detail === 'string') return b.detail
  if (Array.isArray(b.detail)) {
    return b.detail
      .map((d) => (typeof d === 'object' && d && 'msg' in d ? String((d as { msg: string }).msg) : String(d)))
      .join('; ')
  }
  return `Analysis service error (${status})`
}

/**
 * Forward an analysis request to the Python FastAPI service on Railway.
 * Paste mode uses JSON (reliable on Vercel serverless); PDF upload uses multipart.
 */
export async function proxyToPython(
  body: FormData | { resumeText: string; jdText: string },
): Promise<AnalysisResult> {
  const url = `${baseUrl()}/analyze`
  const headers: Record<string, string> = {}
  const secret = process.env.PYTHON_API_SECRET ?? ''
  if (secret) headers['x-api-secret'] = secret

  let fetchInit: RequestInit

  if (body instanceof FormData) {
    fetchInit = { method: 'POST', headers, body }
  } else {
    headers['Content-Type'] = 'application/json'
    fetchInit = {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }
  }

  const res = await fetch(url, {
    ...fetchInit,
    signal: AbortSignal.timeout(25_000),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(parseErrorBody(errBody, res.status))
  }

  return res.json() as Promise<AnalysisResult>
}
