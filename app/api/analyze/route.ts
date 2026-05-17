import { NextRequest, NextResponse } from 'next/server'
import { runAnalysis } from '@/lib/analyzer/pipeline'
import { extractTextFromPdf } from '@/lib/analyzer/pdf'
import { proxyToPython } from '@/lib/analyzer/python-proxy'

const MAX_FILE_BYTES = 5 * 1024 * 1024   // 5 MB
const MAX_TEXT_CHARS = 50_000

const PYTHON_API_URL = process.env.PYTHON_API_URL?.replace(/\/$/, '')

export async function POST(req: NextRequest) {
  try {
    let resumeText = ''
    let jdText = ''
    let uploadedFile: File | null = null

    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      jdText = (form.get('jdText') as string | null) ?? ''

      const file = form.get('file') as File | null
      if (file && file.size > 0) {
        if (file.size > MAX_FILE_BYTES) {
          return NextResponse.json({ error: 'PDF must be under 5 MB' }, { status: 413 })
        }
        uploadedFile = file

        if (!PYTHON_API_URL) {
          const buffer = Buffer.from(await file.arrayBuffer())
          resumeText = await extractTextFromPdf(buffer)
        }
      } else {
        resumeText = (form.get('resumeText') as string | null) ?? ''
      }
    } else {
      const body = (await req.json()) as { resumeText?: string; jdText?: string }
      resumeText = body.resumeText ?? ''
      jdText = body.jdText ?? ''
    }

    const textToCheck = resumeText || (uploadedFile ? '(pdf)' : '')
    if (!textToCheck) {
      return NextResponse.json(
        { error: 'Resume text is required. Paste your resume or upload a PDF.' },
        { status: 400 },
      )
    }
    if (!jdText.trim()) {
      return NextResponse.json({ error: 'Job description is required.' }, { status: 400 })
    }
    if (resumeText.length > MAX_TEXT_CHARS || jdText.length > MAX_TEXT_CHARS) {
      return NextResponse.json(
        { error: 'Input too long. Max 50,000 characters per field.' },
        { status: 413 },
      )
    }

    if (PYTHON_API_URL) {
      try {
        if (uploadedFile) {
          const form = new FormData()
          form.append('jdText', jdText)
          form.append('file', uploadedFile)
          const result = await proxyToPython(form)
          return NextResponse.json(result)
        }

        const result = await proxyToPython({ resumeText, jdText })
        return NextResponse.json(result)
      } catch (proxyErr) {
        const msg = proxyErr instanceof Error ? proxyErr.message : ''
        // Don't mask auth/config mistakes with a silent fallback
        if (msg.includes('Unauthorized') || msg.includes('401')) {
          return NextResponse.json(
            { error: 'Analysis service rejected the request. Check PYTHON_API_SECRET matches Railway API_SECRET.' },
            { status: 502 },
          )
        }
        console.error('Python API proxy failed, using TS fallback:', proxyErr)
        if (uploadedFile && !resumeText) {
          const buffer = Buffer.from(await uploadedFile.arrayBuffer())
          resumeText = await extractTextFromPdf(buffer)
        }
        const result = await runAnalysis(resumeText, jdText)
        return NextResponse.json(result)
      }
    }

    const result = await runAnalysis(resumeText, jdText)
    return NextResponse.json(result)
  } catch (err) {
    console.error('/api/analyze error:', err)
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
