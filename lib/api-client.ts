import type { AnalysisResult } from '@/types/analysis'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function analyzePaste(resumeText: string, jdText: string): Promise<AnalysisResult> {
  return request<AnalysisResult>('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, jdText }),
  })
}

export async function analyzeFile(file: File, jdText: string): Promise<AnalysisResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('jdText', jdText)
  return request<AnalysisResult>('/api/analyze', { method: 'POST', body: form })
}
