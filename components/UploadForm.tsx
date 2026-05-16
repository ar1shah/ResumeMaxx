'use client'

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { analyzePaste, analyzeFile } from '@/lib/api-client'
import type { HistoryEntry } from '@/types/analysis'

type InputMode = 'paste' | 'upload'

function saveToHistory(entry: HistoryEntry) {
  const raw = localStorage.getItem('resumemaxx:history')
  const history: HistoryEntry[] = raw ? JSON.parse(raw) : []
  const updated = [entry, ...history].slice(0, 20)
  localStorage.setItem('resumemaxx:history', JSON.stringify(updated))
}

export function UploadForm() {
  const router = useRouter()
  const [mode, setMode] = useState<InputMode>('paste')
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type === 'application/pdf') {
      setFile(dropped)
      setError(null)
    } else {
      setError('Only PDF files are supported.')
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!jdText.trim()) {
      setError('Paste the job description before analyzing.')
      return
    }
    if (mode === 'paste' && !resumeText.trim()) {
      setError('Paste your resume text before analyzing.')
      return
    }
    if (mode === 'upload' && !file) {
      setError('Select or drop a PDF resume first.')
      return
    }

    setLoading(true)
    try {
      const result =
        mode === 'paste'
          ? await analyzePaste(resumeText, jdText)
          : await analyzeFile(file!, jdText)

      const id = crypto.randomUUID()
      const snippet = (mode === 'paste' ? resumeText : file!.name).slice(0, 100)
      saveToHistory({ id, createdAt: result.createdAt, snippet, result })
      router.push(`/results?id=${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode toggle */}
      <div
        role="group"
        aria-label="Resume input mode"
        className="inline-flex rounded-lg border border-border bg-muted p-1 text-sm"
      >
        {(['paste', 'upload'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null) }}
            className={
              mode === m
                ? 'rounded-md px-4 py-1.5 bg-card text-foreground shadow-sm font-medium transition-all'
                : 'rounded-md px-4 py-1.5 text-muted-foreground hover:text-foreground transition-colors'
            }
          >
            {m === 'paste' ? 'Paste text' : 'Upload PDF'}
          </button>
        ))}
      </div>

      {/* Two-column input grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resume input */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Your resume
          </label>

          {mode === 'paste' ? (
            <Textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste your resume here…"
              className="h-64 resize-none font-mono text-xs leading-relaxed"
              aria-label="Resume text"
            />
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop zone for PDF resume"
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              className={`h-64 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-sm ${
                dragging
                  ? 'border-primary bg-accent/50'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              {file ? (
                <>
                  <span className="text-2xl">📄</span>
                  <span className="font-medium text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB · click to change
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl text-muted-foreground/50">⬆</span>
                  <span className="text-muted-foreground">
                    Drop PDF here or{' '}
                    <span className="text-primary underline-offset-2 hover:underline">
                      browse
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">Max 5 MB</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* Job description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Job description
          </label>
          <Textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Paste the job posting here…"
            className="h-64 resize-none font-mono text-xs leading-relaxed"
            aria-label="Job description text"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-8"
        size="lg"
      >
        {loading ? 'Analyzing…' : 'Analyze match'}
      </Button>
    </form>
  )
}
